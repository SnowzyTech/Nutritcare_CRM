export interface ReturnedStockRecord {
  id: number;
  date: string;
  productName: string;
  state: string;
  agent: string;
  qtyReturned: number;
  damaged: "Yes" | "No";
  remarks: string;
  addedBy: string;
  // Detail page specifics
  rsId: string;
  status: string;
  products: Array<{
    id: number;
    product: string;
    productCode: string;
    unit: string;
    quantity: number;
  }>;
}

export const returnedStockData: ReturnedStockRecord[] = [
  {
    id: 1,
    date: "24 Feb 2026",
    productName: "Balm",
    state: "Abia State",
    agent: "John",
    qtyReturned: 120,
    damaged: "Yes",
    remarks: "Note",
    addedBy: "Yusuf Adeyemi",
    rsId: "RS-000001",
    status: "Damaged",
    products: [
      { id: 1, product: "Balm", productCode: "BL-001", unit: "150", quantity: 120 },
    ],
  },
  {
    id: 2,
    date: "25 Feb 2026",
    productName: "Shred Belly",
    state: "Lagos State",
    agent: "Femi",
    qtyReturned: 120,
    damaged: "Yes",
    remarks: "Note",
    addedBy: "Yusuf Adeyemi",
    rsId: "RS-000002",
    status: "Damaged",
    products: [
      { id: 1, product: "Shred Belly", productCode: "1252365252", unit: "150", quantity: 120 },
    ],
  },
  {
    id: 3,
    date: "27 Feb 2026",
    productName: "Trim & Tone",
    state: "Lagos State",
    agent: "Pamtec",
    qtyReturned: 120,
    damaged: "Yes",
    remarks: "Note",
    addedBy: "Yusuf Adeyemi",
    rsId: "RS-000003",
    status: "Damaged",
    products: [
      { id: 1, product: "Trim & Tone", productCode: "TT-003", unit: "150", quantity: 120 },
    ],
  },
  {
    id: 4,
    date: "01 Mar 2026",
    productName: "Shred Belly",
    state: "Enugu State",
    agent: "John",
    qtyReturned: 120,
    damaged: "Yes",
    remarks: "Note",
    addedBy: "Yusuf Adeyemi",
    rsId: "RS-000004",
    status: "Damaged",
    products: [
      { id: 1, product: "Shred Belly", productCode: "SB-004", unit: "150", quantity: 120 },
    ],
  },
  {
    id: 5,
    date: "04 Mar 2026",
    productName: "Balm",
    state: "Abia State",
    agent: "Kenneth",
    qtyReturned: 120,
    damaged: "Yes",
    remarks: "Note",
    addedBy: "Yusuf Adeyemi",
    rsId: "RS-000005",
    status: "Damaged",
    products: [
      { id: 1, product: "Balm", productCode: "BL-005", unit: "150", quantity: 120 },
    ],
  },
];
