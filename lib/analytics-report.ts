import type { MonthMetrics } from "@/modules/orders/services/analytics.service";

export function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(
    new Date(Number(year), Number(m) - 1, 1)
  );
}

export function formatWeekLabel() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(d);
  return `${fmt(weekStart)} - ${fmt(now)}`;
}

/** Builds a vector PDF report from the metrics and triggers a browser download. */
export async function downloadReportPdf(
  data: MonthMetrics,
  reportType: "weekly" | "monthly",
  periodLabel: string,
  salesRepName: string,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const purple: [number, number, number] = [124, 58, 173];

  const generatedAt = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  // Header
  doc.setTextColor(...purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NutritCare CRM", marginX, 50);

  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Sales Performance Report", marginX, 68);

  // Right-aligned meta
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(salesRepName, pageWidth - marginX, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text(
    `${reportType === "weekly" ? "Weekly" : "Monthly"} Report`,
    pageWidth - marginX,
    66,
    { align: "right" },
  );
  doc.text(periodLabel, pageWidth - marginX, 82, { align: "right" });

  // Divider
  doc.setDrawColor(...purple);
  doc.setLineWidth(1.5);
  doc.line(marginX, 92, pageWidth - marginX, 92);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedAt}`, marginX, 106);

  // KPI table
  autoTable(doc, {
    startY: 122,
    head: [["Key Performance Indicator", "Value"]],
    body: [
      ["Total Products Sold (Delivered)", String(data.ordersDelivered)],
      ["Total Orders Handled", String(data.totalOrders)],
      ["Unique Customers", String(data.uniqueCustomers)],
      ["Best Selling Product", data.bestSellingProduct],
      ["KPI (Delivered / Handled)", `${data.kpi}%`],
      ["General Performance", `${data.generalPerformance}%`],
      ["Upselling Rate", `${data.upsellRate}%`],
      ["Reorder Rating", `${data.reorderRate}%`],
      ["Confirmation Rate", `${data.confirmationRate}%`],
      ["Delivery Rate", `${data.deliveryRate}%`],
      ["Cancellation Rate", `${data.cancellationRate}%`],
      ["Recovery Rate", `${data.recoveryRate}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: purple, textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: 40 },
    alternateRowStyles: { fillColor: [247, 243, 252] },
    margin: { left: marginX, right: marginX },
  });

  // Best Selling Products
  let nextY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Best Selling Products", marginX, nextY);

  autoTable(doc, {
    startY: nextY + 8,
    head: [["Product", "Units Sold"]],
    body:
      data.topProducts.length > 0
        ? data.topProducts.map((p) => [p.name, String(p.qty)])
        : [["No delivered orders in this period.", ""]],
    theme: "striped",
    headStyles: { fillColor: purple, textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: 40 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: marginX, right: marginX },
  });

  // Upselling
  nextY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Upselling - Multi-Item Orders", marginX, nextY);

  autoTable(doc, {
    startY: nextY + 8,
    head: [["Product", "No. of Upsells"]],
    body:
      data.upsoldProducts.length > 0
        ? data.upsoldProducts.map((p) => [p.name, String(p.qty)])
        : [["No multi-item orders in this period.", ""]],
    theme: "striped",
    headStyles: { fillColor: purple, textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10, textColor: 40 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: marginX, right: marginX },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(marginX, ph - 30, pageWidth - marginX, ph - 30);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("NutritCare CRM - Confidential", marginX, ph - 18);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, ph - 18, { align: "right" });
  }

  const safeName = salesRepName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const safePeriod = periodLabel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  doc.save(`NutritCare-${reportType}-report-${safeName}-${safePeriod}.pdf`);
}
