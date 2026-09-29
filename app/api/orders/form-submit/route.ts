import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { nextOrderNumber } from "@/modules/orders/services/order-number.service";
import { notifyRepNewOrder } from "@/modules/notifications/services/order-events.service";
import { pickRepForNewOrder } from "@/modules/orders/services/rep-assignment.service";
import { detectAndFlagDuplicate } from "@/modules/orders/services/duplicate-order.service";
import { resolvePublicFormPackage } from "@/modules/orders/services/tier-pricing.service";
import { toInternationalPhone } from "@/lib/phone";

/** Thrown inside the create transaction when no rep can take the order. */
class NoRepAvailableError extends Error {}

// ── CORS headers — allow any origin so iframes on external sites work ──────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS preflight (browsers send this before the actual POST from cross-origin)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      formId,
      customerName,
      customerPhone,
      customerWhatsapp,
      customerEmail,
      deliveryAddress,
      state,
      lga,
      productId,
      packageName,
      packageQty,
      orderBumpProductId,
      // packagePrice / orderBumpPrice / orderBumpQty are intentionally NOT read
      // from the request: this endpoint is public and unauthenticated, so the
      // customer's posted money is untrusted. Prices/quantities are resolved
      // server-side from the saved form config below.
    } = body as {
      formId?: string;
      customerName: string;
      customerPhone: string;
      customerWhatsapp?: string;
      customerEmail?: string;
      deliveryAddress?: string;
      state?: string;
      lga?: string;
      productId: string;
      packageName?: string;
      packagePrice: number;
      packageQty?: number;
      orderBumpProductId?: string;
      orderBumpPrice?: number;
      orderBumpQty?: number;
    };

    // ── Basic validation ────────────────────────────────────────────────────
    if (!customerName?.trim()) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Customer phone number is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!productId?.trim()) {
      return NextResponse.json(
        { error: "No product selected on this form." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // ── Reject orders from disabled (or deleted) forms; keep the form's saved
    // config for authoritative server-side pricing (below). ─────────────────
    let formData: unknown = null;
    if (formId) {
      const formState = await prisma.form.findUnique({
        where: { id: formId },
        select: { disabledAt: true, deletedAt: true, data: true },
      });
      if (formState && (formState.disabledAt || formState.deletedAt)) {
        return NextResponse.json(
          { error: "This form is no longer accepting orders." },
          { status: 403, headers: CORS_HEADERS }
        );
      }
      formData = formState?.data ?? null;
    }

    const cleanPhone = (customerPhone ?? "").replace(/\s+/g, "");
    const cleanWhatsapp = (customerWhatsapp ?? "").replace(/\s+/g, "");

    // ── Duplicate guard ─────────────────────────────────────────────────────
    // A customer whose confirmation is slow (or a browser/proxy that silently
    // retries the POST) can send the *same* order twice within seconds. With no
    // guard the server would happily create two identical orders. So, before we
    // write anything, we look for an order that already came in for this exact
    // phone + product + form in the last 2 minutes. If we find one, we treat this
    // submission as the same order and return the existing number as success —
    // the second tap looks like it worked, and no duplicate is created. Genuine
    // repeat orders (more than 2 minutes apart, or a different product/phone) are
    // never blocked.
    const DEDUP_WINDOW_MS = 2 * 60 * 1000;
    const recentDuplicate = await prisma.order.findFirst({
      where: {
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
        deletedAt: null,
        ...(formId ? { formId } : {}),
        customer: { phone: cleanPhone },
        items: { some: { productId } },
      },
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { success: true, orderNumber: recentDuplicate.orderNumber, duplicate: true },
        { headers: CORS_HEADERS }
      );
    }

    // ── 1. Create Customer ──────────────────────────────────────────────────
    // Every order is a novel entity: we ALWAYS create a fresh customer record
    // with this submission's own details. We never look up or update an existing
    // customer, so one order can never overwrite the details of another.
    const customer = await prisma.customer.create({
      data: {
        name: customerName.trim(),
        phone: cleanPhone,
        // Normalised phone — how reports recognise a returning customer (docs/sales-reporting.md).
        phoneKey: toInternationalPhone(cleanPhone) || null,
        whatsappNumber: cleanWhatsapp || null,
        email: customerEmail?.trim() || null,
        deliveryAddress: deliveryAddress?.trim() || "",
        state: state?.trim() || "",
        lga: lga?.trim() || "",
      },
    });

    // ── 2. Rep assignment happens inside the create transaction (step 6) ───
    // so concurrent submissions can't take the same turn in the rotation.

    // ── 3. Validate product(s) exist ───────────────────────────────────────
    // The order code prefix comes from the main product; the number itself is
    // assigned atomically inside the create transaction (see below).
    const productIdsToFetch = [productId];
    if (orderBumpProductId) productIdsToFetch.push(orderBumpProductId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIdsToFetch }, deletedAt: null },
      select: { id: true, name: true, sellingPrice: true, costPrice: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    if (!productMap.has(productId)) {
      return NextResponse.json(
        { error: "The selected product no longer exists or has been removed." },
        { status: 422, headers: CORS_HEADERS }
      );
    }

    // ── 5. Build order items ────────────────────────────────────────────────
    // Prices/quantities are resolved server-side from the saved form config —
    // never from the (untrusted) request body. The selected package is matched
    // in the form's saved variations and its STORED price/quantity are used;
    // when it can't be resolved (no form / legacy config) we fall back to the
    // product's own sellingPrice at qty 1. lineTotal = the full package price
    // (the customer pays it regardless of the unit count).
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const mainProduct = productMap.get(productId)!;
    const mainPkg = resolvePublicFormPackage(formData, productId, {
      packageName,
      quantity: packageQty,
    });
    const mainQty = mainPkg?.quantity ?? 1;
    const mainLineTotal = round2(mainPkg ? mainPkg.price : Number(mainProduct.sellingPrice));
    const mainUnitPrice = round2(mainLineTotal / mainQty);

    const orderItemsData: {
      productId: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      costPriceAtSale: number;
    }[] = [
      {
        productId,
        quantity: mainQty,
        unitPrice: mainUnitPrice,
        lineTotal: mainLineTotal,
        costPriceAtSale: Number(mainProduct.costPrice),
      },
    ];

    // Optional order-bump item. Only honoured when it matches the form's
    // configured bump product, and always priced server-side at the product's
    // sellingPrice × 1 (the posted bump price/qty are ignored — untrusted).
    const configuredBumpProduct =
      formData && typeof formData === "object"
        ? (formData as { orderBumpProduct?: unknown }).orderBumpProduct
        : undefined;
    if (
      orderBumpProductId &&
      productMap.has(orderBumpProductId) &&
      (!formId || configuredBumpProduct === orderBumpProductId)
    ) {
      const bumpProduct = productMap.get(orderBumpProductId)!;
      const bumpPrice = round2(Number(bumpProduct.sellingPrice));
      orderItemsData.push({
        productId: orderBumpProductId,
        quantity: 1,
        unitPrice: bumpPrice,
        lineTotal: bumpPrice,
        costPriceAtSale: Number(bumpProduct.costPrice),
      });
    }

    const totalAmount = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

    // ── 6. Create Order in a transaction ───────────────────────────────────
    // The rep is picked under a lock in this same transaction: the next turn in
    // the even daily rotation (see rep-assignment.service.ts).
    const order = await prisma.$transaction(async (tx) => {
      const repId = await pickRepForNewOrder(tx);
      if (!repId) throw new NoRepAvailableError();

      const orderNumber = await nextOrderNumber(tx, productMap.get(productId)?.name);
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          salesRepId: repId,
          // Who the rotation gave it to — never changed by later reassignment.
          autoAssignedToId: repId,
          totalAmount,
          netAmount: totalAmount,
          status: "PENDING",
          ...(formId ? { formId } : {}),
          ...(packageName ? { notes: `Package: ${packageName}` } : {}),
          items: {
            create: orderItemsData,
          },
        },
      });

      // Increment form.orders counter if a formId was provided
      if (formId) {
        await tx.form.updateMany({
          where: { id: formId, deletedAt: null },
          data: { orders: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // Best-effort: flag & disable this order if it exactly duplicates an earlier
    // still-open order for the same customer (a genuine repeat submission that
    // slipped past the 2-minute guard above). Never blocks intake.
    await detectAndFlagDuplicate(order.id);

    // Alert the assigned rep (bell + phone). Runs after the response is sent,
    // so the customer's confirmation is never slowed down by it.
    notifyRepNewOrder(order.id);

    return NextResponse.json(
      { success: true, orderNumber: order.orderNumber },
      { headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    if (error instanceof NoRepAvailableError) {
      return NextResponse.json(
        { error: "No active sales representative available to handle orders right now. Please try again later." },
        { status: 503, headers: CORS_HEADERS }
      );
    }
    console.error("[form-submit] Error creating order:", error);
    return NextResponse.json(
      { error: "Something went wrong while placing your order. Please try again." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
