export interface StockItem {
  id: string;
  category: string;
  product: string;
  qty: number;
  min: number;
  status: "OK" | "Low" | "Watch";
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  items: string;
  time: string;
  status: "In Transit" | "Pending";
}

export interface StockAlert {
  id: string;
  type: "reorder" | "expiry" | "audit";
  message: string;
  timestamp: string;
  color: string;
}

export const stockLevels: StockItem[] = [
  { id: "1", category: "CAT-0077", product: "Balm", qty: 420, min: 100, status: "OK" },
  { id: "2", category: "CAT-0076", product: "Proxact", qty: 34, min: 50, status: "Low" },
  { id: "3", category: "CAT-0075", product: "Trim & Tone", qty: 880, min: 200, status: "OK" },
  { id: "4", category: "CAT-0074", product: "Trim & Tone", qty: 880, min: 200, status: "OK" },
  { id: "5", category: "CAT-0073", product: "Balm", qty: 12, min: 60, status: "Low" },
  { id: "6", category: "CAT-0072", product: "Shred Belly", qty: 55, min: 40, status: "Watch" },
  { id: "7", category: "CAT-0071", product: "Balm", qty: 12, min: 60, status: "Low" },
  { id: "8", category: "CAT-0070", product: "Shred Belly", qty: 55, min: 40, status: "Watch" },
];

export const reorderOrders: PurchaseOrder[] = [
  { id: "1", poNumber: "PO-1092", supplier: "Bello & Co", items: "Balm", time: "14:30", status: "In Transit" },
  { id: "2", poNumber: "PO-1091", supplier: "Eco Supply", items: "Trim & Tone", time: "16:00", status: "Pending" },
  { id: "3", poNumber: "PO-1090", supplier: "Bello & Co", items: "Balm", time: "14:30", status: "In Transit" },
];

export const stockMovementData = [
  { name: "Mo", received: 240, dispatched: 340 },
  { name: "Tu", received: 180, dispatched: 220 },
  { name: "We", received: 480, dispatched: 320 },
  { name: "Th", received: 380, dispatched: 420 },
  { name: "Fr", received: 280, dispatched: 250 },
  { name: "Sa", received: 340, dispatched: 280 },
  { name: "Su", received: 390, dispatched: 360 },
];

export const recentAlerts: StockAlert[] = [
  {
    id: "1",
    type: "reorder",
    message: "CAT-0089 (Balm) below minimum — reorder now",
    timestamp: "10 min ago",
    color: "#EF4444",
  },
  {
    id: "2",
    type: "expiry",
    message: "CAT-0190 expiry in 4 days — 24 units affected",
    timestamp: "23 min ago",
    color: "#F59E0B",
  },
  {
    id: "3",
    type: "audit",
    message: "Audit scheduled for Zone C — tomorrow 08:00",
    timestamp: "Yesterday",
    color: "#3B82F6",
  },
];

export const inventoryStats = {
  totalSkus: { value: "1,248", status: "Active", color: "text-emerald-500" },
  lowStock: { value: "14", status: "REORDER", color: "text-amber-500" },
  expiring: { value: "6", status: "REVIEW", color: "text-rose-500" },
  openPos: { value: "8", status: "PENDING", color: "text-orange-400" },
};
