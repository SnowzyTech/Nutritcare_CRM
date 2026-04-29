export interface OutgoingStockRecord {
  id: number;
  date: string;
  productName: string;
  state: string;
  agent: string;
  otherInfo: string;
  qtySent: number;
  status: "Not Received" | "Received" | "Reversed";
  addedBy: string;
  // Detail page specifics
  soId: string;
  country: string;
  supplierReference: string;
  products: Array<{ id: number; product: string; productCode: string; quantity: number }>;
  notes?: string;
  reversalReason?: string;
  dateReversed?: string;
  reversedBy?: string;
}

export const outgoingStockData: OutgoingStockRecord[] = [
  {
    id: 1,
    date: "24 Feb 2026",
    productName: "Balm",
    state: "Abia State",
    agent: "John",
    otherInfo: "09053702782",
    qtySent: 40,
    status: "Not Received",
    addedBy: "Yusuf Adeyemi",
    soId: "SO-000001",
    country: "Nigeria",
    supplierReference: "REF-4455",
    products: [{ id: 1, product: "Balm", productCode: "BL-001", quantity: 40 }],
  },
  {
    id: 2,
    date: "27 Feb 2026",
    productName: "Shred Belly",
    state: "Lagos State",
    agent: "Austin Adedeji",
    otherInfo: "09053322232",
    qtySent: 170,
    status: "Received",
    addedBy: "Yusuf Adeyemi",
    soId: "SO-000002",
    country: "Nigeria",
    supplierReference: "REF-4456",
    products: [{ id: 1, product: "Shred Belly", productCode: "SB-002", quantity: 170 }],
  },
  {
    id: 3,
    date: "2 Mar 2026",
    productName: "Trim & Tone",
    state: "Ogun State",
    agent: "Linus Papa",
    otherInfo: "09053702782",
    qtySent: 40,
    status: "Not Received",
    addedBy: "Yusuf Adeyemi",
    soId: "SO-000003",
    country: "Nigeria",
    supplierReference: "REF-4457",
    products: [{ id: 1, product: "Trim & Tone", productCode: "TT-003", quantity: 40 }],
  },
];
