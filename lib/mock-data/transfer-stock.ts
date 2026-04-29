export interface TransferStockRecord {
  id: number;
  transferId: string;
  date: string;
  from: string;
  to: string;
  warehouseManager: string;
  items: number;
  totalQty: number;
  status: "RECORDED" | "REVERSED" | "DRAFT";
  addedBy: string;
  // Detail page specifics
  sourceWarehouseAgent: string;
  targetWarehouseAgent: string;
  transferReference: string;
  products: Array<{
    id: number;
    product: string;
    productCode: string;
    unit: string;
    quantity: number;
  }>;
}

export const transferStockData: TransferStockRecord[] = [
  {
    id: 1,
    transferId: "ST-000001",
    date: "24 Feb 2026",
    from: "Owerri,Oricho",
    to: "Owerri,Imo",
    warehouseManager: "Chima",
    items: 1,
    totalQty: 110,
    status: "RECORDED",
    addedBy: "Yusuf Adeyemi",
    sourceWarehouseAgent: "PAMTECH",
    targetWarehouseAgent: "AUSTIN",
    transferReference: "12345",
    products: [
      { id: 1, product: "Shred Belly", productCode: "1252365252", unit: "150", quantity: 200 },
    ],
  },
  {
    id: 2,
    transferId: "ST-000002",
    date: "25 Feb 2026",
    from: "Owerri,Oricho",
    to: "Owerri,Imo",
    warehouseManager: "Chima",
    items: 4,
    totalQty: 250,
    status: "REVERSED",
    addedBy: "Yusuf Adeyemi",
    sourceWarehouseAgent: "PAMTECH",
    targetWarehouseAgent: "AUSTIN",
    transferReference: "12346",
    products: [
      { id: 1, product: "Shred Belly", productCode: "1252365252", unit: "150", quantity: 250 },
    ],
  },
  {
    id: 3,
    transferId: "ST-000003",
    date: "27 Feb 2026",
    from: "Primatech,Lagos",
    to: "Egbeda Lagos",
    warehouseManager: "Kenneth",
    items: 2,
    totalQty: 60,
    status: "DRAFT",
    addedBy: "Yusuf Adeyemi",
    sourceWarehouseAgent: "PAMTECH",
    targetWarehouseAgent: "AUSTIN",
    transferReference: "12347",
    products: [
      { id: 1, product: "Trim & Tone", productCode: "1252365253", unit: "150", quantity: 60 },
    ],
  },
  {
    id: 4,
    transferId: "ST-000004",
    date: "01 Mar 2026",
    from: "WareHouse 3, Abuja",
    to: "Jabi, Abuja",
    warehouseManager: "John",
    items: 6,
    totalQty: 95,
    status: "RECORDED",
    addedBy: "Yusuf Adeyemi",
    sourceWarehouseAgent: "PAMTECH",
    targetWarehouseAgent: "AUSTIN",
    transferReference: "12348",
    products: [
      { id: 1, product: "Balm", productCode: "1252365254", unit: "150", quantity: 95 },
    ],
  },
  {
    id: 5,
    transferId: "ST-000005",
    date: "04 Mar 2026",
    from: "Primatech,Lagos",
    to: "Egbeda Lagos",
    warehouseManager: "Kenneth",
    items: 4,
    totalQty: 15,
    status: "REVERSED",
    addedBy: "Yusuf Adeyemi",
    sourceWarehouseAgent: "PAMTECH",
    targetWarehouseAgent: "AUSTIN",
    transferReference: "12349",
    products: [
      { id: 1, product: "Shred Belly", productCode: "1252365252", unit: "150", quantity: 15 },
    ],
  },
];
