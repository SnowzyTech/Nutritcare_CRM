import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { nextOrderNumber } from "@/modules/orders/services/order-number.service";

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
      packagePrice,
      packageQty,
      orderBumpProductId,
      orderBumpPrice,
      orderBumpQty,
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

    // ── Reject orders from disabled (or deleted) forms ──────────────────────
    if (formId) {
      const formState = await prisma.form.findUnique({
        where: { id: formId },
        select: { disabledAt: true, deletedAt: true },
      });
      if (formState && (formState.disabledAt || formState.deletedAt)) {
        return NextResponse.json(
          { error: "This form is no longer accepting orders." },
          { status: 403, headers: CORS_HEADERS }
        );
      }
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
        whatsappNumber: cleanWhatsapp || null,
        email: customerEmail?.trim() || null,
        deliveryAddress: deliveryAddress?.trim() || "",
        state: state?.trim() || "",
        lga: lga?.trim() || "",
      },
    });

    // ── 2. Auto-assign to the sales rep with fewest open orders ────────────
    const salesReps = await prisma.user.findMany({
      where: { role: "SALES_REP", isActive: true },
      select: { id: true },
    });

    if (!salesReps.length) {
      return NextResponse.json(
        { error: "No active sales representative available to handle orders right now. Please try again later." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const openCounts = await prisma.order.groupBy({
      by: ["salesRepId"],
      where: {
        salesRepId: { in: salesReps.map((r) => r.id) },
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedAt: null,
      },
      _count: { id: true },
    });
    const countMap = new Map(openCounts.map((c) => [c.salesRepId, c._count.id]));
    const assignedRep = salesReps.reduce((least, rep) =>
      (countMap.get(rep.id) ?? 0) < (countMap.get(least.id) ?? 0) ? rep : least
    );

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
    // Use the package's full price as the unit price; quantity is the package units.
    // lineTotal = packagePrice (the customer pays the full package price regardless of units)
    const mainQty = Math.max(1, packageQty ?? 1);
    const mainUnitPrice =
      packagePrice > 0
        ? Math.round((packagePrice / mainQty) * 100) / 100
        : Number(productMap.get(productId)!.sellingPrice);
    const mainLineTotal = mainUnitPrice * mainQty;

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
        costPriceAtSale: Number(productMap.get(productId)!.costPrice),
      },
    ];

    // Optional order-bump item
    if (orderBumpProductId && productMap.has(orderBumpProductId)) {
      const bumpQty = Math.max(1, orderBumpQty ?? 1);
      const bumpUnitPrice =
        orderBumpPrice && orderBumpPrice > 0
          ? Math.round((orderBumpPrice / bumpQty) * 100) / 100
          : Number(productMap.get(orderBumpProductId)!.sellingPrice);
      orderItemsData.push({
        productId: orderBumpProductId,
        quantity: bumpQty,
        unitPrice: bumpUnitPrice,
        lineTotal: bumpUnitPrice * bumpQty,
        costPriceAtSale: Number(productMap.get(orderBumpProductId)!.costPrice),
      });
    }

    const totalAmount = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

    // ── 6. Create Order in a transaction ───────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await nextOrderNumber(tx, productMap.get(productId)?.name);
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          salesRepId: assignedRep.id,
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

    return NextResponse.json(
      { success: true, orderNumber: order.orderNumber },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[form-submit] Error creating order:", error);
    return NextResponse.json(
      { error: "Something went wrong while placing your order. Please try again." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
