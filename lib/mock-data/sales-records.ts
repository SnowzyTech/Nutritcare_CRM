export type OrderStatus = 'Pending' | 'Delivered' | 'Cancelled' | 'Failed';
export type RemittanceStatus = 'Not Paid' | 'Paid';

export interface SalesRecord {
  id: string;
  orderId: string;
  orderStatus: OrderStatus;
  customer: string;
  state: string;
  products: string;
  qty: string;
  total: string;
  discount: string;
  netAmount: string;
  deliveryFee: string;
  remStatus: RemittanceStatus;
  agent: string;
  date: string;
}

export const salesRecordsData: SalesRecord[] = [
  {
    id: '1',
    orderId: 'ORD-1001',
    orderStatus: 'Pending',
    customer: 'Musa\nAbdullahi',
    state: 'Kano',
    products: 'Fonio Mill',
    qty: '8 packs',
    total: '₦75,000',
    discount: '₦6,000 (8%)',
    netAmount: '₦69,000',
    deliveryFee: '₦3,500',
    remStatus: 'Not Paid',
    agent: 'Ibrahim\nLawal',
    date: '2026-03-02'
  },
  {
    id: '2',
    orderId: 'ORD-1002',
    orderStatus: 'Delivered',
    customer: 'Blessing\nOkorie',
    state: 'Rivers',
    products: 'Trim & Tone',
    qty: '4 packs',
    total: '₦69,500',
    discount: '₦5,000 (7%)',
    netAmount: '₦64,500',
    deliveryFee: '₦4,000',
    remStatus: 'Not Paid',
    agent: 'Emeka\nNwosu',
    date: '2026-03-02'
  },
  {
    id: '3',
    orderId: 'ORD-1003',
    orderStatus: 'Cancelled',
    customer: 'Usman\nGarba',
    state: 'Kaduna',
    products: 'Prosxact',
    qty: '2 packs',
    total: '₦65,000',
    discount: '₦4,000 (6%)',
    netAmount: '₦61,000',
    deliveryFee: '₦3,200',
    remStatus: 'Not Paid',
    agent: 'Yusuf\nSani',
    date: '2026-03-03'
  },
  {
    id: '4',
    orderId: 'ORD-1004',
    orderStatus: 'Failed',
    customer: 'Mary\nUdo',
    state: 'Akwa Ibom',
    products: 'Shred Belly',
    qty: '6 packs',
    total: '₦99,500',
    discount: '₦7,000 (7%)',
    netAmount: '₦88,000',
    deliveryFee: '₦4,500',
    remStatus: 'Not Paid',
    agent: 'Samuel\nEtim',
    date: '2026-03-03'
  },
  {
    id: '5',
    orderId: 'ORD-1005',
    orderStatus: 'Failed',
    customer: 'Godwin\nEfe',
    state: 'Delta',
    products: 'Neuro-Vive\nBalm',
    qty: '4 packs',
    total: '₦55,000',
    discount: '₦3,500 (6%)',
    netAmount: '₦51,500',
    deliveryFee: '₦2,500',
    remStatus: 'Not Paid',
    agent: 'Monday\nOghene',
    date: '2026-03-03'
  },
  {
    id: '6',
    orderId: 'ORD-1002',
    orderStatus: 'Delivered',
    customer: 'Blessing\nOkorie',
    state: 'Rivers',
    products: 'Trim & Tone',
    qty: '4 packs',
    total: '₦69,500',
    discount: '₦5,000 (7%)',
    netAmount: '₦64,500',
    deliveryFee: '₦4,000',
    remStatus: 'Not Paid',
    agent: 'Emeka\nNwosu',
    date: '2026-03-02'
  },
  {
    id: '7',
    orderId: 'ORD-1001',
    orderStatus: 'Pending',
    customer: 'Musa\nAbdullahi',
    state: 'Kano',
    products: 'Fonio Mill',
    qty: '8 packs',
    total: '₦75,000',
    discount: '₦6,000 (8%)',
    netAmount: '₦69,000',
    deliveryFee: '₦3,500',
    remStatus: 'Not Paid',
    agent: 'Ibrahim\nLawal',
    date: '2026-03-02'
  },
  {
    id: '8',
    orderId: 'ORD-1002',
    orderStatus: 'Delivered',
    customer: 'Blessing\nOkorie',
    state: 'Rivers',
    products: 'Trim & Tone',
    qty: '4 packs',
    total: '₦69,500',
    discount: '₦5,000 (7%)',
    netAmount: '₦64,500',
    deliveryFee: '₦4,000',
    remStatus: 'Paid',
    agent: 'Emeka\nNwosu',
    date: '2026-03-02'
  },
  {
    id: '9',
    orderId: 'ORD-1001',
    orderStatus: 'Pending',
    customer: 'Musa\nAbdullahi',
    state: 'Kano',
    products: 'Fonio Mill',
    qty: '8 packs',
    total: '₦75,000',
    discount: '₦6,000 (8%)',
    netAmount: '₦69,000',
    deliveryFee: '₦3,500',
    remStatus: 'Not Paid',
    agent: 'Ibrahim\nLawal',
    date: '2026-03-02'
  },
  {
    id: '10',
    orderId: 'ORD-1002',
    orderStatus: 'Delivered',
    customer: 'Blessing\nOkorie',
    state: 'Rivers',
    products: 'Trim & Tone',
    qty: '4 packs',
    total: '₦69,500',
    discount: '₦5,000 (7%)',
    netAmount: '₦64,500',
    deliveryFee: '₦4,000',
    remStatus: 'Paid',
    agent: 'Emeka\nNwosu',
    date: '2026-03-02'
  },
];
