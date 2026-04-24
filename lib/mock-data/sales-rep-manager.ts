export interface SalesRep {
  id: string;
  name: string;
  pendingOrders: number;
  phone: string;
  performance: number;
  avatar: string | null;
}

export const MOCK_SALES_REPS: SalesRep[] = [
  { id: "1", name: "Blessing Ehijie", pendingOrders: 5, phone: "0803 547 2198", performance: 83, avatar: null },
  { id: "2", name: "Adebimpe Tolani", pendingOrders: 19, phone: "0803 547 2198", performance: 89, avatar: null },
  { id: "3", name: "Chiamaka Okorie", pendingOrders: 12, phone: "0706 381 4402", performance: 87, avatar: null },
  { id: "4", name: "Ibrahim Sadiq", pendingOrders: 10, phone: "0816 992 1057", performance: 86, avatar: null },
  { id: "5", name: "Funmilayo Ogunleye", pendingOrders: 9, phone: "0905 274 6631", performance: 88, avatar: null },
  { id: "6", name: "Emeka Nwankwo", pendingOrders: 20, phone: "0813 608 7749", performance: 86, avatar: null },
  { id: "7", name: "Zainab Bello", pendingOrders: 6, phone: "0703 915 4280", performance: 84, avatar: null },
  { id: "8", name: "Tunde Ajayi", pendingOrders: 13, phone: "0806 447 3096", performance: 68, avatar: null },
  { id: "9", name: "Blessing Efiong", pendingOrders: 17, phone: "0810 532 1184", performance: 71, avatar: null },
];

export interface RepDetail {
  name: string;
  role: string;
  team: string;
  isTeamLead: boolean;
  isActive: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  kpiTarget: string;
  kpiAchieved: number;
  orders: { all: number; pending: number; confirmed: number; delivered: number; cancelled: number; failed: number };
  analytics: { generalPerformance: number; deliveryRate: number; salesTotal: number };
  statesHandled: string[];
  teamLead: string;
  branch: string;
  accountCreatedDate: string;
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export interface MonthlyAnalytics {
  [month: string]: {
    generalPerformance: number;
    deliveryRate: number;
    salesTotal: number;
    trend: string;
  };
}

export const MOCK_MONTHLY_ANALYTICS: Record<string, MonthlyAnalytics> = {
  "2": {
    "January": { generalPerformance: 75, deliveryRate: 72, salesTotal: 480, trend: "+8%" },
    "February": { generalPerformance: 78, deliveryRate: 75, salesTotal: 510, trend: "+10%" },
    "March": { generalPerformance: 80, deliveryRate: 78, salesTotal: 540, trend: "+12%" },
    "April": { generalPerformance: 82, deliveryRate: 80, salesTotal: 560, trend: "+11%" },
    "May": { generalPerformance: 79, deliveryRate: 76, salesTotal: 520, trend: "+9%" },
    "June": { generalPerformance: 81, deliveryRate: 79, salesTotal: 550, trend: "+10%" },
    "July": { generalPerformance: 83, deliveryRate: 81, salesTotal: 570, trend: "+13%" },
    "August": { generalPerformance: 80, deliveryRate: 78, salesTotal: 540, trend: "+12%" },
    "September": { generalPerformance: 77, deliveryRate: 74, salesTotal: 500, trend: "+7%" },
    "October": { generalPerformance: 79, deliveryRate: 76, salesTotal: 520, trend: "+9%" },
    "November": { generalPerformance: 81, deliveryRate: 79, salesTotal: 550, trend: "+11%" },
    "December": { generalPerformance: 80, deliveryRate: 78, salesTotal: 540, trend: "+12%" },
  },
  "1": {
    "January": { generalPerformance: 78, deliveryRate: 80, salesTotal: 580, trend: "+10%" },
    "February": { generalPerformance: 80, deliveryRate: 82, salesTotal: 600, trend: "+12%" },
    "March": { generalPerformance: 83, deliveryRate: 85, salesTotal: 620, trend: "+14%" },
    "April": { generalPerformance: 85, deliveryRate: 87, salesTotal: 640, trend: "+15%" },
    "May": { generalPerformance: 82, deliveryRate: 84, salesTotal: 610, trend: "+13%" },
    "June": { generalPerformance: 84, deliveryRate: 86, salesTotal: 630, trend: "+14%" },
    "July": { generalPerformance: 86, deliveryRate: 88, salesTotal: 650, trend: "+16%" },
    "August": { generalPerformance: 83, deliveryRate: 85, salesTotal: 620, trend: "+14%" },
    "September": { generalPerformance: 80, deliveryRate: 82, salesTotal: 590, trend: "+11%" },
    "October": { generalPerformance: 82, deliveryRate: 84, salesTotal: 610, trend: "+13%" },
    "November": { generalPerformance: 84, deliveryRate: 86, salesTotal: 630, trend: "+15%" },
    "December": { generalPerformance: 83, deliveryRate: 85, salesTotal: 620, trend: "+14%" },
  },
};

export const MOCK_REP_DETAILS: Record<string, RepDetail> = {
  "2": {
    name: "Adebimpe Tolani",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: true,
    phone: "091524472657",
    whatsapp: "091524472657",
    email: "adebimpe@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 50,
    orders: { all: 38, pending: 10, confirmed: 8, delivered: 7, cancelled: 2, failed: 2 },
    analytics: { generalPerformance: 80, deliveryRate: 78, salesTotal: 540 },
    statesHandled: ["Ogun State", "Abia State"],
    teamLead: "Ehijie Blessing",
    branch: "Orelope, Lagos",
    accountCreatedDate: "May 27th, 2025",
  },
  "1": {
    name: "Blessing Ehijie",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: true,
    isActive: true,
    phone: "0803 547 2198",
    whatsapp: "0803 547 2198",
    email: "blessing@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 83,
    orders: { all: 50, pending: 5, confirmed: 20, delivered: 20, cancelled: 3, failed: 2 },
    analytics: { generalPerformance: 83, deliveryRate: 85, salesTotal: 620 },
    statesHandled: ["Lagos State", "Oyo State"],
    teamLead: "Self",
    branch: "Ikeja, Lagos",
    accountCreatedDate: "January 15th, 2025",
  },
  "3": {
    name: "Chiamaka Okorie",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: true,
    phone: "0706 381 4402",
    whatsapp: "0706 381 4402",
    email: "chiamaka@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 87,
    orders: { all: 45, pending: 12, confirmed: 15, delivered: 15, cancelled: 2, failed: 1 },
    analytics: { generalPerformance: 87, deliveryRate: 85, salesTotal: 600 },
    statesHandled: ["Enugu State", "Anambra State"],
    teamLead: "Ehijie Blessing",
    branch: "Enugu, Enugu",
    accountCreatedDate: "March 10th, 2025",
  },
  "4": {
    name: "Ibrahim Sadiq",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: false,
    phone: "0816 992 1057",
    whatsapp: "0816 992 1057",
    email: "ibrahim@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 86,
    orders: { all: 40, pending: 10, confirmed: 15, delivered: 10, cancelled: 3, failed: 2 },
    analytics: { generalPerformance: 86, deliveryRate: 80, salesTotal: 580 },
    statesHandled: ["Kano State", "Kaduna State"],
    teamLead: "Ehijie Blessing",
    branch: "Kano, Kano",
    accountCreatedDate: "February 20th, 2025",
  },
  "5": {
    name: "Funmilayo Ogunleye",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: true,
    phone: "0905 274 6631",
    whatsapp: "0905 274 6631",
    email: "funmilayo@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 88,
    orders: { all: 35, pending: 9, confirmed: 10, delivered: 14, cancelled: 1, failed: 1 },
    analytics: { generalPerformance: 88, deliveryRate: 90, salesTotal: 650 },
    statesHandled: ["Oyo State", "Osun State"],
    teamLead: "Ehijie Blessing",
    branch: "Ibadan, Oyo",
    accountCreatedDate: "April 5th, 2025",
  },
  "6": {
    name: "Emeka Nwankwo",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: true,
    phone: "0813 608 7749",
    whatsapp: "0813 608 7749",
    email: "emeka@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 86,
    orders: { all: 60, pending: 20, confirmed: 20, delivered: 15, cancelled: 3, failed: 2 },
    analytics: { generalPerformance: 86, deliveryRate: 82, salesTotal: 700 },
    statesHandled: ["Imo State", "Abia State"],
    teamLead: "Ehijie Blessing",
    branch: "Owerri, Imo",
    accountCreatedDate: "June 12th, 2025",
  },
  "7": {
    name: "Zainab Bello",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: false,
    phone: "0703 915 4280",
    whatsapp: "0703 915 4280",
    email: "zainab@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 84,
    orders: { all: 30, pending: 6, confirmed: 10, delivered: 12, cancelled: 1, failed: 1 },
    analytics: { generalPerformance: 84, deliveryRate: 88, salesTotal: 480 },
    statesHandled: ["Kwara State", "Niger State"],
    teamLead: "Ehijie Blessing",
    branch: "Ilorin, Kwara",
    accountCreatedDate: "July 8th, 2025",
  },
  "8": {
    name: "Tunde Ajayi",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: true,
    phone: "0806 447 3096",
    whatsapp: "0806 447 3096",
    email: "tunde@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 68,
    orders: { all: 45, pending: 13, confirmed: 12, delivered: 10, cancelled: 5, failed: 5 },
    analytics: { generalPerformance: 68, deliveryRate: 65, salesTotal: 400 },
    statesHandled: ["Ondo State", "Ekiti State"],
    teamLead: "Ehijie Blessing",
    branch: "Akure, Ondo",
    accountCreatedDate: "August 22nd, 2025",
  },
  "9": {
    name: "Blessing Efiong",
    role: "Sales Rep",
    team: "Team 2",
    isTeamLead: false,
    isActive: true,
    phone: "0810 532 1184",
    whatsapp: "0810 532 1184",
    email: "blessing.efiong@gmail.com",
    kpiTarget: "XXXXX",
    kpiAchieved: 71,
    orders: { all: 50, pending: 17, confirmed: 15, delivered: 12, cancelled: 4, failed: 2 },
    analytics: { generalPerformance: 71, deliveryRate: 70, salesTotal: 450 },
    statesHandled: ["Cross River", "Akwa Ibom"],
    teamLead: "Ehijie Blessing",
    branch: "Calabar, Cross River",
    accountCreatedDate: "September 15th, 2025",
  },
};

export const MOCK_ORDERS = [
  { id: "o1", email: "adewale.johnson.ng@gmail.com", name: "Adewale Johnson", agent: null, product: "Prosxact", qty: 3, date: "03-02-2026", status: "PENDING" },
  { id: "o2", email: "funke.adebayo.ng@gmail.com", name: "Funke Adebayo", agent: null, product: "Shred Belly", qty: 2, date: "03-02-2026", status: "PENDING" },
  { id: "o3", email: "ibrahim.musa.ng@gmail.com", name: "Ibrahim Musa", agent: { name: "Mr. Ola", state: "Lagos State" }, product: "Fonio-Mill", qty: 5, date: "03-02-2026", status: "FAILED" },
  { id: "o4", email: "johnade@gmail.com", name: "John Ade", agent: { name: "Fymack", state: "Kaduna" }, product: "Trim and Tone", qty: 4, date: "03-02-2026", status: "CONFIRMED" },
  { id: "o5", email: "blessing.eze.ng@gmail.com", name: "Blessing Eze", agent: { name: "Mr. Oyelowo", state: "Oyo State" }, product: "Neuro-Vive Balm", qty: 1, date: "03-02-2026", status: "DELIVERED" },
  { id: "o6", email: "sola.ogunleye.ng@gmail.com", name: "Sola Ogunleye", agent: null, product: "Prosxact", qty: 3, date: "03-02-2026", status: "PENDING" },
  { id: "o7", email: "halima.abdullahi.ng@gmail.com", name: "Halima Abdullahi", agent: { name: "Mr. Praise", state: "Ebonyi State" }, product: "Shred Belly", qty: 6, date: "03-02-2026", status: "CANCELLED" },
  { id: "o8", email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: null, product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "PENDING" },
  { id: "o9", email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: { name: "Mrs. Sunmi", state: "Oyo State" }, product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "FAILED" },
  { id: "o10", email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: { name: "Mrs. Sunmi", state: "Oyo State" }, product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "DELIVERED" },
];

export interface OrderDetail {
  orderId: string;
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" | "FAILED";
  customer: {
    fullName: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    state: string;
    lga: string;
    landmark: string;
  };
  product: string;
  quantity: number;
  upsell: { product: string; quantity: number } | null;
  totalPrice: string;
  source: string;
  contactedVia: "phone" | "whatsapp" | "none";
  deliveryAgent?: string;
  failReason?: string;
  cancelReason?: string;
  prescription: string;
  history: string[];
}

export const MOCK_ORDER_DETAILS: Record<string, OrderDetail> = {
  "o1": {
    orderId: "012994248",
    status: "PENDING",
    customer: {
      fullName: "Adewale Johnson",
      phone: "0906 713 6429",
      whatsapp: "0906 713 6429",
      email: "08023764913",
      address: "15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State, Nigeria",
      state: "Oyo State",
      lga: "Ibadan North Local Government Area",
      landmark: "Bodija Market / University of Ibadan Main Gate",
    },
    product: "Prosxact",
    quantity: 4,
    upsell: null,
    totalPrice: "₦84,000",
    source: "WhatsApp",
    contactedVia: "none",
    prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.",
    history: ["Order Created", "Sales Rep Assigned: Adebimpe Tolani"],
  },
  "o5": {
    orderId: "012994248",
    status: "DELIVERED",
    customer: {
      fullName: "Blessing Eze",
      phone: "08023764913",
      whatsapp: "08023764913",
      email: "Blessing.eze.ng@gmail.com",
      address: "15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State, Nigeria",
      state: "Oyo State",
      lga: "Ibadan North Local Government Area",
      landmark: "Bodija Market / University of Ibadan Main Gate",
    },
    product: "Prosxact",
    quantity: 4,
    upsell: { product: "Prosxact", quantity: 2 },
    totalPrice: "₦84,000",
    source: "WhatsApp",
    contactedVia: "phone",
    deliveryAgent: "Mrs Sunmi",
    prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.",
    history: ["Order Created", "Sales Rep Assigned: Adebimpe Tolani", "Order Confirmed", "Prescription Sent", "Delivery Agent Assigned: Mrs Sunmi", "Order Delivered"],
  },
  "o3": {
    orderId: "012994248",
    status: "FAILED",
    customer: {
      fullName: "Victor Uche",
      phone: "+234 803 456 1290",
      whatsapp: "+234 803 456 1290",
      email: "victor.uche.ng@gmail.com",
      address: "No. 42 Adeoyo Ring Road, Ibadan, Oyo State",
      state: "Oyo State",
      lga: "Ibadan North Local Government Area",
      landmark: "Near University College Hospital (UCH)",
    },
    product: "Shred Belly",
    quantity: 6,
    upsell: null,
    totalPrice: "₦84,000",
    source: "WhatsApp",
    contactedVia: "whatsapp",
    failReason: "Customer's number was not going through at point of delivery",
    prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.",
    history: ["Order Created", "Sales Rep Assigned: Adebimpe Tolani", "Order Confirmed", "Prescription Sent", "Delivery Agent Assigned: Mrs Sunmi", "Order Failed"],
  },
  "o7": {
    orderId: "012994248",
    status: "CANCELLED",
    customer: {
      fullName: "Halima Abdullahi",
      phone: "+234 803 456 1290",
      whatsapp: "+234 803 456 1290",
      email: "halima.abdullahi.ng@gmail.com",
      address: "No. 17 Ogoja Road, Abakaliki, Ebonyi State, Nigeria",
      state: "Ebonyi State",
      lga: "Abakaliki Local Government Area",
      landmark: "Opposite Ebonyi State University Main Gate",
    },
    product: "Prosxact",
    quantity: 6,
    upsell: null,
    totalPrice: "₦84,000",
    source: "WhatsApp",
    contactedVia: "whatsapp",
    cancelReason: "Customer's number was not going through",
    prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.",
    history: ["Order Created", "Sales Rep Assigned: Adebimpe Tolani", "Order Cancelled"],
  },
};

export const MOCK_TEAM_ORDERS = [
  { id: "t1",  email: "adewale.johnson.ng@gmail.com",  name: "Adewale Johnson",  agent: null,                               salesRep: "Blessing Efiong",    product: "Prosxact",      qty: 3, date: "03-02-26", status: "PENDING"   },
  { id: "t2",  email: "funke.adebayo.ng@gmail.com",  name: "Funke Adebayo",    agent: null,                               salesRep: "Funmilayo Ogunleye", product: "Shred Belly",   qty: 2, date: "03-02-26", status: "PENDING"   },
  { id: "t3",  email: "ibrahim.musa.ng@gmail.com",  name: "Ibrahim Musa",     agent: { name: "Mr. Ola",    state: "Lagos State"  }, salesRep: "Adebimpe Tolani",   product: "Fonio-Mill",    qty: 5, date: "03-02-26", status: "FAILED"    },
  { id: "t4",  email: "chinedu.okafor.ng@gmail.com", name: "Chinedu Okafor",   agent: { name: "Mr. Qudus",  state: "Lagos State"  }, salesRep: "Mr. Qudus",         product: "Trim and Tone", qty: 4, date: "03-02-26", status: "CONFIRMED" },
  { id: "t5",  email: "blessing.eze.ng@gmail.com", name: "Blessing Eze",     agent: { name: "Mr. Oyelowo",state: "Ogun State"   }, salesRep: "Mr. Oyelowo",       product: "Neuro-Vive Balm",qty:1, date: "03-02-26", status: "DELIVERED" },
  { id: "t6",  email: "sola.ogunleye.ng@gmail.com", name: "Sola Ogunleye",    agent: null,                               salesRep: "Zainab Bello",       product: "Prosxact",      qty: 3, date: "03-02-26", status: "PENDING"   },
  { id: "t7",  email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: null,                               salesRep: "Emeka Nwankwo",      product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "PENDING"   },
  { id: "t8",  email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Blessing Efiong",    product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "FAILED"    },
  { id: "t9",  email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Mrs. Sunmi",        product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "DELIVERED" },
  { id: "t10", email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Blessing Efiong",    product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "PENDING"   },
  { id: "t11", email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Chiamaka Okorie",   product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "CONFIRMED" },
  { id: "t12", email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Chiamaka Okorie",   product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "PENDING"   },
  { id: "t13", email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Emeka Nwankwo",      product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "DELIVERED" },
  { id: "t14", email: "victor.uche.ng@gmail.com",  name: "Victor Uche",      agent: { name: "Mrs. Sunmi", state: "Oyo State"   }, salesRep: "Emeka Nwankwo",      product: "Fonio-Mill",    qty: 7, date: "03-02-26", status: "PENDING"   },
  { id: "t15", email: "tunde.ajayi.ng@gmail.com",  name: "Tunde Ajayi",      agent: null,                               salesRep: "Tunde Ajayi",        product: "Prosxact",      qty: 2, date: "03-02-26", status: "CANCELLED" },
];
