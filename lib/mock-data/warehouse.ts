// ─────────────────────────────────────────────────────────────────────────────
// Warehouse Module — Centralised Mock Data
// All warehouse pages import from this single source of truth.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

export type PickPackOrder = {
  id: string;
  items: number;
  picker: string;
  location: string;
  status: "Packed" | "Queued";
};

export type GoodsReceiving = {
  id: string;
  units: number;
  supplier: string;
  qc: "Pending" | "Passed";
  status: "QC Check" | "Shelved";
};

export type LocationBin = {
  id: string; // e.g. "A1"
  zone: string;
  bin: string;
  status: "Full" | "Partial" | "Reserved" | "Empty" | "Damage";
};

export type Alert = {
  id: number;
  message: string;
  time: string;
  severity: "warning" | "info" | "error";
};

export type ReturnItem = {
  id: string;
  date: string;
  productName: string;
  state: string;
  agentWarehouse: string;
  qtyReturned: number;
  damaged: string;
  remarks: string;
  addedBy: string;
};

export type IncomingGood = {
  id: string;
  date: string;
  siId: string;
  supplier: string;
  warehouse: string;
  supplierRef: string;
  product: string;
  status: "Recorded" | "Draft" | "Reversed";
  createdTime: string;
  addedBy: string;
  action: string;
};

export type OutgoingOrder = {
  id: string;
  date: string;
  productName: string;
  state: string;
  agent: string;
  otherInfo: string;
  qtySent: number;
  status: "Received" | "Not Received";
  addedBy: string;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "warning" | "info" | "success" | "error";
  read: boolean;
};

// ── Dashboard stat cards ─────────────────────────────────────────────────────

export const dashboardStats = {
  ordersToPick: 28,
  incomingStocks: 12,
  readyForDispatch: 19,
  damageReports: 3,
};

// ── Pick & Pack Queue ────────────────────────────────────────────────────────

export const pickPackOrders: PickPackOrder[] = [
  { id: "#ORD-4821", items: 4, picker: "J.Eze",  location: "A3-B2", status: "Packed"  },
  { id: "#ORD-4820", items: 2, picker: "P.Adaku", location: "B1-C4", status: "Packed"  },
  { id: "#ORD-4819", items: 7, picker: "A.Musa",  location: "A1-A2", status: "Queued"  },
  { id: "#ORD-4818", items: 1, picker: "K.Obi",   location: "C2-D1", status: "Packed"  },
  { id: "#ORD-4817", items: 5, picker: "-",        location: "B3-B4", status: "Queued"  },
  { id: "#ORD-4816", items: 2, picker: "P.Adaku", location: "B1-C4", status: "Packed"  },
  { id: "#ORD-4815", items: 7, picker: "-",        location: "A1-A2", status: "Queued"  },
  { id: "#ORD-4814", items: 1, picker: "K.Obi",   location: "C2-D1", status: "Packed"  },
  { id: "#ORD-4813", items: 5, picker: "-",        location: "B3-B4", status: "Queued"  },
  { id: "#ORD-4812", items: 1, picker: "K.Obi",   location: "C2-D1", status: "Packed"  },
];

// ── Location Map ─────────────────────────────────────────────────────────────

export const locationBins: LocationBin[] = [
  // Zone A
  { id: "A1", zone: "A", bin: "1", status: "Full"     },
  { id: "A2", zone: "A", bin: "2", status: "Full"     },
  { id: "A3", zone: "A", bin: "3", status: "Partial"  },
  { id: "A4", zone: "A", bin: "4", status: "Full"     },
  { id: "A5", zone: "A", bin: "5", status: "Empty"    },
  { id: "A6", zone: "A", bin: "6", status: "Reserved" },
  // Zone B
  { id: "B1", zone: "B", bin: "1", status: "Full"     },
  { id: "B2", zone: "B", bin: "2", status: "Full"     },
  { id: "B3", zone: "B", bin: "3", status: "Partial"  },
  { id: "B4", zone: "B", bin: "4", status: "Damage"   },
  { id: "B5", zone: "B", bin: "5", status: "Empty"    },
  { id: "B6", zone: "B", bin: "6", status: "Partial"  },
  // Zone C
  { id: "C1", zone: "C", bin: "1", status: "Full"     },
  { id: "C2", zone: "C", bin: "2", status: "Damage"   },
  { id: "C3", zone: "C", bin: "3", status: "Full"     },
  { id: "C4", zone: "C", bin: "4", status: "Partial"  },
  { id: "C5", zone: "C", bin: "5", status: "Reserved" },
  { id: "C6", zone: "C", bin: "6", status: "Partial"  },
  // Zone D
  { id: "D1", zone: "D", bin: "1", status: "Reserved" },
  { id: "D2", zone: "D", bin: "2", status: "Full"     },
  { id: "D3", zone: "D", bin: "3", status: "Damage"   },
  { id: "D4", zone: "D", bin: "4", status: "Full"     },
  { id: "D5", zone: "D", bin: "5", status: "Empty"    },
  { id: "D6", zone: "D", bin: "6", status: "Partial"  },
];

// ── Goods Receiving ──────────────────────────────────────────────────────────

export const goodsReceiving: GoodsReceiving[] = [
  { id: "#SI-4821", units: 4, supplier: "J.Eze",   qc: "Pending", status: "QC Check" },
  { id: "#SI-4820", units: 2, supplier: "-",        qc: "Passed",  status: "Shelved"  },
  { id: "#SI-4819", units: 7, supplier: "A.Musa",  qc: "Pending", status: "QC Check" },
  { id: "#SI-4818", units: 1, supplier: "K.Obi",   qc: "Passed",  status: "Shelved"  },
  { id: "#SI-4817", units: 5, supplier: "P.Adaku", qc: "Pending", status: "QC Check" },
];

// ── Dashboard Alerts ─────────────────────────────────────────────────────────

export const dashboardAlerts: Alert[] = [
  { id: 1, message: "Bin B3-B4 flagged — water damage reported",     time: "5 mins ago",  severity: "error"   },
  { id: 2, message: "#ORD-4823 overdue pick — no picker assigned",   time: "12 mins ago", severity: "warning" },
  { id: 3, message: "GRN-881 QC check required before shelving",     time: "1 hr ago",    severity: "info"    },
];

// ── Returns ──────────────────────────────────────────────────────────────────

export const returnItems: ReturnItem[] = [
  { id: "1", date: "24 Feb 2026", productName: "Balm",        state: "Abia State",  agentWarehouse: "John",    qtyReturned: 120, damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
  { id: "2", date: "25 Feb 2026", productName: "Shred Belly", state: "Lagos State", agentWarehouse: "Felix",   qtyReturned: 120, damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
  { id: "3", date: "27 Feb 2026", productName: "Trim & Tone", state: "Lagos State", agentWarehouse: "Pamtec",  qtyReturned: 130, damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
  { id: "4", date: "01 Mar 2026", productName: "Shred Belly", state: "Enugu State", agentWarehouse: "John",    qtyReturned: 120, damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
  { id: "5", date: "04 Mar 2026", productName: "Balm",        state: "Abia State",  agentWarehouse: "Kenneth", qtyReturned: 120, damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
];

// ── Incoming Goods ───────────────────────────────────────────────────────────

export const incomingGoods: IncomingGood[] = [
  { id: "1", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "2", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Abuja Warehouse", supplierRef: "1234567", product: "125", status: "Draft", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "3", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "4", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Lagos Warehouse", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "5", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "6", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "7", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Owerri Warehouse", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "8", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Reversed", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "9", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "10", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Owerri Warehouse", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "11", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "12", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Reversed", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
  { id: "13", date: "24 Feb 2026", siId: "SI-000001", supplier: "Austin", warehouse: "Pamtech", supplierRef: "1234567", product: "125", status: "Recorded", createdTime: "03:11pm", addedBy: "Yusuf Adeyemi", action: "Created" },
];

// ── Outgoing Orders ──────────────────────────────────────────────────────────

export const outgoingOrders: OutgoingOrder[] = [
  { id: "1", date: "24 Feb 2026", productName: "Balm",        state: "Abia State",  agent: "John",           otherInfo: "09053702782", qtySent: 40,  status: "Not Received", addedBy: "Yusuf Adeyemi" },
  { id: "2", date: "27 Feb 2026", productName: "Shred Belly", state: "Lagos State", agent: "Austin Adedeji", otherInfo: "09053222232", qtySent: 170, status: "Received",     addedBy: "Yusuf Adeyemi" },
  { id: "3", date: "2 Mar 2026",  productName: "Trim & Tone", state: "Ogun State",  agent: "Linus Papa",     otherInfo: "09053702782", qtySent: 40,  status: "Not Received", addedBy: "Yusuf Adeyemi" },
];

// ── Notifications ────────────────────────────────────────────────────────────

export const notifications: Notification[] = [
  { id: 1, title: "Water Damage Detected",      message: "Bin B3-B4 flagged for water damage. Immediate inspection required.",              time: "5 mins ago",  type: "error",   read: false },
  { id: 2, title: "Overdue Pick Order",         message: "#ORD-4823 has been in queue for 2 hours with no picker assigned.",               time: "12 mins ago", type: "warning", read: false },
  { id: 3, title: "QC Check Required",          message: "GRN-881 arrived from NutriLabs Ltd. QC check must be completed before shelving.", time: "1 hr ago",    type: "info",    read: false },
  { id: 4, title: "Shipment Shelved",           message: "#INC-5010 — 120 units of Trim & Tone successfully shelved at Zone A.",           time: "2 hrs ago",   type: "success", read: true  },
  { id: 5, title: "Low Stock Alert",            message: "Balm Recovery stock at Zone C is running low (< 10 units remaining).",           time: "3 hrs ago",   type: "warning", read: true  },
  { id: 6, title: "Picker Assigned",            message: "J.Eze has been assigned to #ORD-4821 — Location A3-B2.",                        time: "4 hrs ago",   type: "info",    read: true  },
  { id: 7, title: "Dispatch Completed",         message: "#OUT-8820 — 24 units dispatched to Abuja Depot successfully.",                  time: "5 hrs ago",   type: "success", read: true  },
  { id: 8, title: "Incoming Goods Rejected",    message: "#INC-5009 from WellSource Inc. failed QC check and has been rejected.",         time: "Yesterday",   type: "error",   read: true  },
  { id: 9, title: "Returns Processed",          message: "3 return items have been restocked to their respective bin locations.",          time: "Yesterday",   type: "success", read: true  },
  { id: 10, title: "System Maintenance",        message: "Scheduled maintenance window tonight 11 PM – 1 AM. System may be unavailable.", time: "2 days ago",  type: "info",    read: true  },
];
