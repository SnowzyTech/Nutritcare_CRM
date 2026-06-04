import type { OrderInvoiceDetail } from "@/modules/finance/services/sales-record.service";

const COMPANY_NAME = "NutritCare";

const naira = (n: number) =>
  `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatLongDate = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );

/**
 * Builds a vector PDF of a single invoice from real order data and triggers a
 * browser download. Reuses the same jsPDF + autotable stack as the analytics
 * reports (`report-buttons.tsx`).
 */
export async function downloadInvoicePdf(order: OrderInvoiceDetail) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const inv = order.invoice;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const purple: [number, number, number] = [124, 58, 173];

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setTextColor(...purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Invoice", marginX, 52);

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(inv.invoiceNumber, marginX, 70);

  // Right-aligned company block
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(COMPANY_NAME, pageWidth - marginX, 52, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(`Order ${order.orderNumber}`, pageWidth - marginX, 68, { align: "right" });
  doc.text(`Status: ${inv.status}`, pageWidth - marginX, 82, { align: "right" });

  // Divider
  doc.setDrawColor(...purple);
  doc.setLineWidth(1.5);
  doc.line(marginX, 94, pageWidth - marginX, 94);

  // ── Meta + Bill To ──────────────────────────────────────────────────────────
  let y = 118;
  const labelColor: [number, number, number] = [150, 150, 150];
  const valueColor: [number, number, number] = [40, 40, 40];

  const metaPair = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...labelColor);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...valueColor);
    doc.text(value, x, yy + 14);
  };

  metaPair("Issue Date", formatLongDate(inv.invoiceDate), marginX, y);
  metaPair("Due Date", inv.dueDate ? formatLongDate(inv.dueDate) : "On Delivery", marginX + 170, y);
  metaPair("Terms", inv.terms ?? "—", marginX + 340, y);

  // Bill To
  y += 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...labelColor);
  doc.text("BILL TO", marginX, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...valueColor);
  doc.text(order.customer.name, marginX, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const billLines = [
    order.customer.address,
    [order.customer.lga, order.customer.state].filter(Boolean).join(", "),
    order.customer.phone,
    order.customer.email ?? "",
  ].filter((l) => l && l.trim().length > 0);
  billLines.forEach((line, i) => doc.text(line, marginX, y + 32 + i * 13));

  const tableStartY = y + 32 + billLines.length * 13 + 18;

  // ── Line items ────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: tableStartY,
    head: [["Product(s)", "Qty", "Unit Price", "Amount"]],
    body: inv.items.map((it) => [
      it.description,
      String(it.quantity),
      naira(it.unitPrice),
      naira(it.amount),
    ]),
    theme: "striped",
    headStyles: { fillColor: purple, textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: 40 },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  let ty = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  const totalsRight = pageWidth - marginX;
  const totalsLabelX = pageWidth - marginX - 200;

  const totalsRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 13 : 10);
    doc.setTextColor(bold ? 40 : 110, bold ? 40 : 110, bold ? 40 : 110);
    doc.text(label, totalsLabelX, ty);
    doc.text(value, totalsRight, ty, { align: "right" });
    ty += bold ? 22 : 18;
  };

  totalsRow("Subtotal", naira(inv.subtotal));
  if (inv.discountAmount > 0) {
    totalsRow(
      `Discount${inv.discountPercent > 0 ? ` (${inv.discountPercent}%)` : ""}`,
      `- ${naira(inv.discountAmount)}`,
    );
  }
  if (inv.shipping > 0) totalsRow("Delivery Fee", naira(inv.shipping));

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(totalsLabelX, ty - 6, totalsRight, ty - 6);
  ty += 6;
  totalsRow("Total", naira(inv.invoiceTotal), true);

  // ── Footer ──────────────────────────────────────────────────────────────────
  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(marginX, ph - 30, pageWidth - marginX, ph - 30);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${COMPANY_NAME} — Thank you for your business.`, marginX, ph - 18);
  if (order.salesRep) {
    doc.text(`Sales Rep: ${order.salesRep}`, pageWidth - marginX, ph - 18, { align: "right" });
  }

  const safeNo = inv.invoiceNumber.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  doc.save(`${COMPANY_NAME}-Invoice-${safeNo}.pdf`);
}
