export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  pendingOrders: number;
  phoneNumber: string;
  whatsapp: string;
  email: string;
  performance: number;
  kpiAchievement: number;
  team: string;
  isOnline: boolean;
}

export interface Order {
  id: string;
  gmail: string;
  name: string;
  agent?: {
    name: string;
    state: string;
  };
  product: string;
  quantity: number;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled' | 'Failed';
}

export interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

export const SALES_REPS: SalesRep[] = [
  { 
    id: 'blessing-ehijie', 
    name: 'Blessing Ehijie', 
    avatar: 'https://ui-avatars.com/api/?name=Blessing+Ehijie&background=f3f4f6&color=6b7280', 
    pendingOrders: 5, 
    phoneNumber: '0803 547 2198', 
    whatsapp: '0803 547 2198',
    email: 'blessingehiijie@gamail.com',
    performance: 83, 
    kpiAchievement: 50,
    team: 'Team 2',
    isOnline: true
  },
  { 
    id: 'adebimpe-tolani', 
    name: 'Adebimpe Tolani', 
    avatar: 'https://ui-avatars.com/api/?name=Adebimpe+Tolani&background=f3f4f6&color=6b7280', 
    pendingOrders: 19, 
    phoneNumber: '091524472657', 
    whatsapp: '091524472657',
    email: 'blessingehiijie@gamail.com',
    performance: 89, 
    kpiAchievement: 50,
    team: 'Team 2',
    isOnline: true
  },
  { 
    id: 'chiamaka-okorie', 
    name: 'Chiamaka Okorie', 
    avatar: 'https://ui-avatars.com/api/?name=Chiamaka+Okorie&background=f3f4f6&color=6b7280', 
    pendingOrders: 12, 
    phoneNumber: '0706 381 4402', 
    whatsapp: '0706 381 4402',
    email: 'chiamaka@gmail.com',
    performance: 87, 
    kpiAchievement: 45,
    team: 'Team 1',
    isOnline: false
  },
  { 
    id: 'ibrahim-sadiq', 
    name: 'Ibrahim Sadiq', 
    avatar: 'https://ui-avatars.com/api/?name=Ibrahim+Sadiq&background=f3f4f6&color=6b7280', 
    pendingOrders: 10, 
    phoneNumber: '0816 992 1057', 
    whatsapp: '0816 992 1057',
    email: 'ibrahim@gmail.com',
    performance: 86, 
    kpiAchievement: 40,
    team: 'Team 2',
    isOnline: true
  },
  { 
    id: 'funmilayo-ogunleye', 
    name: 'Funmilayo Ogunleye', 
    avatar: 'https://ui-avatars.com/api/?name=Funmilayo+Ogunleye&background=f3f4f6&color=6b7280', 
    pendingOrders: 9, 
    phoneNumber: '0905 274 6631', 
    whatsapp: '0905 274 6631',
    email: 'funmilayo@gmail.com',
    performance: 88, 
    kpiAchievement: 55,
    team: 'Team 1',
    isOnline: true
  },
  { 
    id: 'emeka-nwankwo', 
    name: 'Emeka Nwankwo', 
    avatar: 'https://ui-avatars.com/api/?name=Emeka+Nwankwo&background=f3f4f6&color=6b7280', 
    pendingOrders: 20, 
    phoneNumber: '0813 608 7749', 
    whatsapp: '0813 608 7749',
    email: 'emeka@gmail.com',
    performance: 86, 
    kpiAchievement: 48,
    team: 'Team 2',
    isOnline: true
  },
  { 
    id: 'zainab-bello', 
    name: 'Zainab Bello', 
    avatar: 'https://ui-avatars.com/api/?name=Zainab+Bello&background=f3f4f6&color=6b7280', 
    pendingOrders: 6, 
    phoneNumber: '0703 915 4280', 
    whatsapp: '0703 915 4280',
    email: 'zainab@gmail.com',
    performance: 84, 
    kpiAchievement: 42,
    team: 'Team 1',
    isOnline: false
  },
  { 
    id: 'tunde-ajayi', 
    name: 'Tunde Ajayi', 
    avatar: 'https://ui-avatars.com/api/?name=Tunde+Ajayi&background=f3f4f6&color=6b7280', 
    pendingOrders: 13, 
    phoneNumber: '0806 447 3096', 
    whatsapp: '0806 447 3096',
    email: 'tunde@gmail.com',
    performance: 68, 
    kpiAchievement: 35,
    team: 'Team 2',
    isOnline: true
  },
  { 
    id: 'blessing-efiong-1', 
    name: 'Blessing Efiong', 
    avatar: 'https://ui-avatars.com/api/?name=Blessing+Efiong&background=f3f4f6&color=6b7280', 
    pendingOrders: 17, 
    phoneNumber: '0810 532 1184', 
    whatsapp: '0810 532 1184',
    email: 'blessing1@gmail.com',
    performance: 71, 
    kpiAchievement: 38,
    team: 'Team 2',
    isOnline: true
  },
  { 
    id: 'blessing-efiong-2', 
    name: 'Blessing Efiong', 
    avatar: 'https://ui-avatars.com/api/?name=Blessing+Efiong&background=f3f4f6&color=6b7280', 
    pendingOrders: 17, 
    phoneNumber: '0810 532 1184', 
    whatsapp: '0810 532 1184',
    email: 'blessing2@gmail.com',
    performance: 71, 
    kpiAchievement: 38,
    team: 'Team 2',
    isOnline: true
  },
];

export const MOCK_ORDERS: Record<string, Order[]> = {
  'adebimpe-tolani': [
    { id: '1', gmail: 'adewale.johnson.ng@gmail.com', name: 'Adewale Johnson', product: 'Prosxact', quantity: 3, date: '03-02-2026', status: 'Pending' },
    { id: '2', gmail: 'funke.adebayo.ng@gmail.com', name: 'Funke Adebayo', product: 'Shred Belly', quantity: 2, date: '03-02-2026', status: 'Pending' },
    { id: '3', gmail: 'ibrahim.musa.ng@gmail.com', name: 'Ibrahim Musa', agent: { name: 'Mr. Ola', state: 'Lagos State' }, product: 'Fonio-Mill', quantity: 5, date: '03-02-2026', status: 'Failed' },
    { id: '4', gmail: 'johnade@gmail.com', name: 'John Ade', agent: { name: 'Flymark', state: 'Kaduna' }, product: 'Prosxact', quantity: 5, date: '03-02-2026', status: 'Confirmed' },
    { id: '5', gmail: 'blessing.eze.ng@gmail.com', name: 'Blessing Eze', agent: { name: 'Mr. Oyelowo', state: 'Ogun State' }, product: 'Neuro-Vive Balm', quantity: 1, date: '03-02-2026', status: 'Cancelled' },
    { id: '6', gmail: 'sola.ogunleye.ng@gmail.com', name: 'Sola Ogunleye', agent: { name: 'Flymack', state: 'Kano State' }, product: 'Prosxact', quantity: 4, date: '03-02-2026', status: 'Delivered' },
    { id: '7', gmail: 'halima.abdullahi.ng@gmail.com', name: 'Halima Abdullahi', agent: { name: 'Mr. Praise', state: 'Ebonyi State' }, product: 'Shred Belly', quantity: 6, date: '03-02-2026', status: 'Cancelled' },
    { id: '8', gmail: 'victor.uche.ng@gmail.com', name: 'Victor Uche', product: 'Fonio-Mill', quantity: 7, date: '04-02-2026', status: 'Pending' },
    { id: '9', gmail: 'victor.uche.ng@gmail.com', name: 'Victor Uche', agent: { name: 'Mrs. Sunmi', state: 'Oyo State' }, product: 'Fonio-Mill', quantity: 7, date: '04-02-2026', status: 'Failed' },
    { id: '10', gmail: 'victor.uche.ng@gmail.com', name: 'Victor Uche', agent: { name: 'Mrs. Sunmi', state: 'Oyo State' }, product: 'Fonio-Mill', quantity: 7, date: '04-02-2026', status: 'Delivered' },
  ]
};

export const MOCK_ANALYTICS: Record<string, any> = {
  'adebimpe-tolani': {
    metrics: [
      { label: 'Total Products Sold', value: 180, change: '+21%', isPositive: true },
      { label: 'Total Order/Customer', value: 64, change: '+12%', isPositive: true },
      { label: 'Best Selling Product', value: 'Prosxact', change: 'Neuro-Vive Balm', isPositive: true, subText: 'last month' },
      { label: 'General Performance', value: '80%', change: '+12%', isPositive: true },
      { label: 'Upselling Rate', value: '30%', change: '+12%', isPositive: true },
      { label: 'Confirmation Rate', value: '60%', change: '+12%', isPositive: true },
      { label: 'Delivery Rate', value: '78%', change: '+12%', isPositive: true },
      { label: 'Cancellation Rate', value: '8%', change: '+12%', isPositive: true },
      { label: 'Recovery Rate', value: '27%', change: '+12%', isPositive: true },
    ],
    kpi: {
      value: '21%',
      target: 'XXXXXXX',
      change: '+12%'
    },
    bestSellingProducts: [
      { product: 'Prosxact', amount: 41 },
      { product: 'Neuro-Vive Balm', amount: 33 },
      { product: 'Trim and Tone', amount: 29 },
      { product: 'After-Natal', amount: 25 },
      { product: 'Shred Belly', amount: 22 },
      { product: 'Linix', amount: 18 },
      { product: 'Fonio Mill', amount: 12 },
    ],
    upsellingRate: [
      { product: 'Neuro-Vive Balm', upsell: 10 },
      { product: 'Prosxact', upsell: 5 },
      { product: 'After-Natal', upsell: 5 },
      { product: 'Trim and Tone', upsell: 4 },
      { product: 'Fonio Mill', upsell: 0 },
      { product: 'Shred Belly', upsell: 0 },
      { product: 'Linix', upsell: 0 },
    ]
  }
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ALL_ORDERS = [
  { id: '1', gmail: 'adewale.johnson.ng@gmail.com', name: 'Adewale Johnson', agent: { name: 'Mr. Ola', state: 'Kaduna' }, state: 'Kaduna', salesRep: 'Oyetude', product: 'Prosxact', quantity: 3, date: 'Today', status: 'Pending' },
  { id: '2', gmail: 'funke.adebayo.ng@gmail.com', name: 'Funke Adebayo', agent: { name: 'Flymark', state: 'Abia' }, state: 'Abia', salesRep: 'Tayo', product: 'Shred Belly', quantity: 2, date: 'Today', status: 'Pending' },
  { id: '3', gmail: 'ibrahim.musa.ng@gmail.com', name: 'Ibrahim Musa', agent: { name: 'Mr. Ola', state: 'Lagos' }, state: 'Lagos', salesRep: 'Mr. Olumide', product: 'Fonio-Mill', quantity: 5, date: 'Today', status: 'Failed' },
  { id: '4', gmail: 'chinedu.okafor.ng@gmail.com', name: 'Chinedu Okafor', agent: { name: 'Mr. Qudus', state: 'Lagos' }, state: 'Lagos', salesRep: 'Blessing Ehijie', product: 'Trim and Tone', quantity: 4, date: 'Today', status: 'Confirmed' },
  { id: '5', gmail: 'blessing.eze.ng@gmail.com', name: 'Blessing Eze', agent: { name: 'Mr. Oyelowo', state: 'Ogun' }, state: 'Ogun', salesRep: 'Sunmi', product: 'Neuro-Vive Balm', quantity: 1, date: 'Today', status: 'Cancelled' },
  { id: '6', gmail: 'sola.ogunleye.ng@gmail.com', name: 'Sola Ogunleye', agent: { name: 'Flymack', state: 'Kano' }, state: 'Kano', salesRep: 'Yusuf', product: 'Prosxact', quantity: 3, date: 'Today', status: 'Pending' },
  { id: '7', gmail: 'halima.abdullahi.ng@gmail.com', name: 'Halima Abdullahi', agent: { name: 'Mr. Praise', state: 'Ebonyi' }, state: 'Ebonyi', salesRep: 'Deboarah', product: 'Shred Belly', quantity: 6, date: '03-02-2026', status: 'Delivered' },
  { id: '8', gmail: 'victor.uche.ng@gmail.com', name: 'Victor Uche', agent: { name: 'Mrs. Sunmi', state: 'Oyo' }, state: 'Oyo', salesRep: 'Peace', product: 'Fonio-Mill', quantity: 7, date: '04-02-2026', status: 'Pending' },
  { id: '9', gmail: 'victor.uche.ng@gmail.com', name: 'Victor Uche', agent: { name: 'Mrs. Sunmi', state: 'Oyo' }, state: 'Oyo', salesRep: 'Esther', product: 'Fonio-Mill', quantity: 7, date: '04-02-2026', status: 'Failed' },
  { id: '10', gmail: 'victor.uche.ng@gmail.com', name: 'Victor Uche', agent: { name: 'Mrs. Sunmi', state: 'Oyo' }, state: 'Oyo', salesRep: 'Esther', product: 'Fonio-Mill', quantity: 7, date: '04-02-2026', status: 'Failed' },
  { id: '11', gmail: 'grace.okon.ng@gmail.com', name: 'Grace Okon', agent: { name: 'Mr. Ade', state: 'Rivers' }, state: 'Rivers', salesRep: 'Tunde', product: 'Prosxact', quantity: 2, date: '05-02-2026', status: 'Confirmed' },
  { id: '12', gmail: 'david.obi.ng@gmail.com', name: 'David Obi', agent: { name: 'Mrs. Nkechi', state: 'Enugu' }, state: 'Enugu', salesRep: 'Chioma', product: 'After-Natal', quantity: 3, date: '05-02-2026', status: 'Delivered' },
];

export const TEAM_ANALYTICS_DATA: Record<string, Record<string, any>> = {
  'Team 1': {
    'This Month': {
      totalProductsSold: { value: 180, change: '+21%' },
      totalOrderCustomer: { value: 64, change: '+12%' },
      bestSellingProduct: { value: 'Prosxact', change: 'Neuro-Vive Balm' },
      generalPerformance: { value: '80%', change: '+12%' },
      upsellingRate: { value: '30%', change: '+12%' },
      confirmationRate: { value: '60%', change: '+12%' },
      deliveryRate: { value: '78%', change: '+12%' },
      cancellationRate: { value: '8%', change: '+12%' },
      recoveryRate: { value: '27%', change: '+12%' },
      kpi: { value: '21%', target: 'XXXXXXX', change: '+12%' },
    },
    'September': {
      totalProductsSold: { value: 165, change: '+18%' },
      totalOrderCustomer: { value: 58, change: '+10%' },
      bestSellingProduct: { value: 'Neuro-Vive Balm', change: 'Prosxact' },
      generalPerformance: { value: '75%', change: '+10%' },
      upsellingRate: { value: '28%', change: '+10%' },
      confirmationRate: { value: '55%', change: '+10%' },
      deliveryRate: { value: '72%', change: '+10%' },
      cancellationRate: { value: '10%', change: '+10%' },
      recoveryRate: { value: '25%', change: '+10%' },
      kpi: { value: '18%', target: 'XXXXXXX', change: '+10%' },
    },
    'October': {
      totalProductsSold: { value: 195, change: '+25%' },
      totalOrderCustomer: { value: 70, change: '+15%' },
      bestSellingProduct: { value: 'Prosxact', change: 'Trim and Tone' },
      generalPerformance: { value: '85%', change: '+15%' },
      upsellingRate: { value: '35%', change: '+15%' },
      confirmationRate: { value: '65%', change: '+15%' },
      deliveryRate: { value: '82%', change: '+15%' },
      cancellationRate: { value: '6%', change: '+15%' },
      recoveryRate: { value: '30%', change: '+15%' },
      kpi: { value: '25%', target: 'XXXXXXX', change: '+15%' },
    },
  },
  'Team 2': {
    'This Month': {
      totalProductsSold: { value: 150, change: '+18%' },
      totalOrderCustomer: { value: 52, change: '+10%' },
      bestSellingProduct: { value: 'Shred Belly', change: 'Prosxact' },
      generalPerformance: { value: '72%', change: '+10%' },
      upsellingRate: { value: '25%', change: '+10%' },
      confirmationRate: { value: '55%', change: '+10%' },
      deliveryRate: { value: '70%', change: '+10%' },
      cancellationRate: { value: '12%', change: '+10%' },
      recoveryRate: { value: '22%', change: '+10%' },
      kpi: { value: '18%', target: 'XXXXXXX', change: '+10%' },
    },
    'September': {
      totalProductsSold: { value: 140, change: '+15%' },
      totalOrderCustomer: { value: 48, change: '+8%' },
      bestSellingProduct: { value: 'Prosxact', change: 'Shred Belly' },
      generalPerformance: { value: '68%', change: '+8%' },
      upsellingRate: { value: '22%', change: '+8%' },
      confirmationRate: { value: '50%', change: '+8%' },
      deliveryRate: { value: '65%', change: '+8%' },
      cancellationRate: { value: '15%', change: '+10%' },
      recoveryRate: { value: '20%', change: '+8%' },
      kpi: { value: '15%', target: 'XXXXXXX', change: '+8%' },
    },
    'October': {
      totalProductsSold: { value: 160, change: '+20%' },
      totalOrderCustomer: { value: 56, change: '+12%' },
      bestSellingProduct: { value: 'Shred Belly', change: 'Fonio-Mill' },
      generalPerformance: { value: '76%', change: '+12%' },
      upsellingRate: { value: '28%', change: '+12%' },
      confirmationRate: { value: '58%', change: '+12%' },
      deliveryRate: { value: '74%', change: '+12%' },
      cancellationRate: { value: '10%', change: '+12%' },
      recoveryRate: { value: '24%', change: '+12%' },
      kpi: { value: '20%', target: 'XXXXXXX', change: '+12%' },
    },
  }
};

export const BEST_SELLING_PRODUCTS = [
  { product: 'Prosxact', amount: 41 },
  { product: 'Neuro-Vive Balm', amount: 33 },
  { product: 'Trim and Tone', amount: 29 },
  { product: 'After-Natal', amount: 25 },
  { product: 'Shred Belly', amount: 22 },
  { product: 'Linix', amount: 18 },
  { product: 'Fonio Mill', amount: 12 },
];

export interface OrderDetail {
  id: string;
  orderId: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled' | 'Failed';
  repName: string;
  customer: {
    fullName: string;
    phoneNumber: string;
    whatsappNumber: string;
    email: string;
    deliveryAddress: string;
    state: string;
    lga: string;
    landmark: string;
  };
  product: {
    name: string;
    quantity: number;
    imageColor: string;
    totalPrice: string;
  };
  upsoldProduct?: {
    name: string;
    quantity: number;
  };
  deliveryFee?: string;
  estimatedDeliveryDate?: string;
  agent?: {
    name: string;
    location: string;
  };
  contactMethod: 'Phone Call' | 'WhatsApp' | 'Both' | 'None';
  cancellationReason?: string;
  failureReason?: string;
  prescription?: string;
  source: string;
  orderDate: string;
  history: Array<{
    event: string;
    date: string;
    repName?: string;
    agentName?: string;
  }>;
}

export const ORDER_DETAILS: Record<string, OrderDetail> = {
  '012994248': {
    id: '1',
    orderId: '012994248',
    status: 'Confirmed',
    repName: 'Adebimpe Tolani',
    customer: {
      fullName: 'John Ade',
      phoneNumber: '08023764913',
      whatsappNumber: '08023764913',
      email: 'johnade@gmail.com',
      deliveryAddress: 'No. 18 Independence Way, Kaduna',
      state: 'Kaduna State',
      lga: 'Kaduna North Local Government Area',
      landmark: 'Near Arewa House',
    },
    product: {
      name: 'Prosxact',
      quantity: 3,
      imageColor: '#1e40af',
      totalPrice: 'N84,000',
    },
    upsoldProduct: {
      name: 'Prosxact',
      quantity: 2,
    },
    deliveryFee: 'N2,025',
    estimatedDeliveryDate: '24hours',
    agent: {
      name: 'Flymack',
      location: 'Kaduna',
    },
    contactMethod: 'WhatsApp',
    source: 'WhatsApp',
    orderDate: '2025-11-08 14:37:52',
    history: [
      { event: 'Order Created', date: '2025-11-08 14:37:52' },
      { event: 'Sales Rep Assiged', date: '2025-11-08 14:37:52', repName: 'Adebimpe Tolani' },
      { event: 'Order Comfirmed', date: '2025-11-08 14:37:52' },
      { event: 'Prescription Sent', date: '2025-11-08 14:37:52' },
    ],
  },
  '012994249': {
    id: '2',
    orderId: '012994249',
    status: 'Pending',
    repName: 'Blessing Ehijie',
    customer: {
      fullName: 'Adewale Johnson',
      phoneNumber: '0906 713 6429',
      whatsappNumber: '0906 713 6429',
      email: '08023764913',
      deliveryAddress: '15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State, Nigeria',
      state: 'Oyo State',
      lga: 'Ibadan North Local Government Area',
      landmark: 'Bodija Market / University of Ibadan Main Gate',
    },
    product: {
      name: 'Prosxact',
      quantity: 4,
      imageColor: '#1e40af',
      totalPrice: 'N84,000',
    },
    contactMethod: 'None',
    source: 'WhatsApp',
    orderDate: '2025-11-08 14:37:52',
    history: [
      { event: 'Order Created', date: '2025-11-08 14:37:52' },
      { event: 'Sales Rep Assiged', date: '2025-11-08 14:37:52', repName: 'Blessing Ehijie' },
    ],
  },
  '012994250': {
    id: '3',
    orderId: '012994250',
    status: 'Cancelled',
    repName: 'Chiamaka Okorie',
    customer: {
      fullName: 'Halima Abdullahi',
      phoneNumber: '+234 803 456 1290',
      whatsappNumber: '+234 803 456 1290',
      email: 'halima.abdullahi.ng@gmail.com',
      deliveryAddress: 'No. 17 Ogoja Road, Abakaliki, Ebonyi State, Nigeria',
      state: 'Ebonyi State',
      lga: 'Abakaliki Local Government Area',
      landmark: 'Opposite Ebonyi State University Main Gate',
    },
    product: {
      name: 'Shred Belly',
      quantity: 6,
      imageColor: '#b91c1c',
      totalPrice: 'N84,000',
    },
    contactMethod: 'WhatsApp',
    cancellationReason: "Customer's number was not going through",
    source: 'WhatsApp',
    orderDate: '2025-11-08 14:37:52',
    history: [
      { event: 'Order Created', date: '2025-11-08 14:37:52' },
      { event: 'Sales Rep Assiged', date: '2025-11-08 14:37:52', repName: 'Chiamaka Okorie' },
      { event: 'Order Cancelled', date: '2025-11-08 14:37:52' },
    ],
  },
  '012994251': {
    id: '4',
    orderId: '012994251',
    status: 'Failed',
    repName: 'Ibrahim Sadiq',
    customer: {
      fullName: 'Victor Uche',
      phoneNumber: '+234 803 456 1290',
      whatsappNumber: '+234 803 456 1290',
      email: 'victor.uche.ng@gmail.com',
      deliveryAddress: 'No. 42 Adeoyo Ring Road, Ibadan, Oyo State',
      state: 'Oyo State',
      lga: 'Ibadan North Local Government Area',
      landmark: 'Near University College Hospital (UCH)',
    },
    product: {
      name: 'Shred Belly',
      quantity: 6,
      imageColor: '#b91c1c',
      totalPrice: 'N84,000',
    },
    deliveryFee: 'N2,025',
    agent: {
      name: 'Mrs. Sunmi',
      location: 'Oyo State',
    },
    contactMethod: 'WhatsApp',
    failureReason: "Customer's number was not going through at point of delivery",
    prescription: 'Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.',
    source: 'WhatsApp',
    orderDate: '2025-11-08 14:37:52',
    history: [
      { event: 'Order Created', date: '2025-11-08 14:37:52' },
      { event: 'Sales Rep Assiged', date: '2025-11-08 14:37:52', repName: 'Ibrahim Sadiq' },
      { event: 'Order Comfirmed', date: '2025-11-08 14:37:52' },
      { event: 'Prescription Sent', date: '2025-11-08 14:37:52' },
      { event: 'Delivery Agent Assigned', date: '2025-11-08 14:37:52', agentName: 'Mrs Sunmi' },
      { event: 'Order Failed', date: '2025-11-08 14:37:52' },
    ],
  },
  '012994252': {
    id: '5',
    orderId: '012994252',
    status: 'Delivered',
    repName: 'Funmilayo Ogunleye',
    customer: {
      fullName: 'Sola Ogunleye',
      phoneNumber: '08023764913',
      whatsappNumber: '08023764913',
      email: 'sola.ogunleye.ng@gmail.com',
      deliveryAddress: 'No. 18 Yakubu Avenue, Ungwan Rimi, Kaduna',
      state: 'Kaduna State',
      lga: 'Kaduna North Local Government Area',
      landmark: 'Near Ungwan Rimi Market',
    },
    product: {
      name: 'Prosxact',
      quantity: 2,
      imageColor: '#1e40af',
      totalPrice: 'N84,000',
    },
    upsoldProduct: {
      name: 'Prosxact',
      quantity: 2,
    },
    deliveryFee: 'N2,025',
    agent: {
      name: 'Mrs. Sunmi',
      location: 'Oyo State',
    },
    contactMethod: 'Phone Call',
    prescription: 'Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.',
    source: 'WhatsApp',
    orderDate: '2025-11-08 14:37:52',
    history: [
      { event: 'Order Created', date: '2025-11-08 14:37:52' },
      { event: 'Sales Rep Assiged', date: '2025-11-08 14:37:52', repName: 'Funmilayo Ogunleye' },
      { event: 'Order Comfirmed', date: '2025-11-08 14:37:52' },
      { event: 'Prescription Sent', date: '2025-11-08 14:37:52' },
      { event: 'Delivery Agent Assigned', date: '2025-11-08 14:37:52', agentName: 'Mrs Sunmi' },
      { event: 'Order Delivered', date: '2025-11-08 14:37:52' },
    ],
  },
};

export const AGENT_DETAILS = {
  'Flymack': {
    name: 'Flymack',
    phone: '0803 547 2198',
    email: 'flymack@delivery.com',
    location: 'Kaduna',
    rating: 4.8,
    totalDeliveries: 1250,
    activeOrders: 5,
  },
  'Mrs. Sunmi': {
    name: 'Mrs. Sunmi',
    phone: '0816 992 1057',
    email: 'sunmi.o@delivery.com',
    location: 'Oyo State',
    rating: 4.9,
    totalDeliveries: 850,
    activeOrders: 3,
  }
};

export const UPSELLING_RATE_DATA = [
  { product: 'Neuro-Vive Balm', upsell: 10 },
  { product: 'Prosxact', upsell: 5 },
  { product: 'After-Natal', upsell: 5 },
  { product: 'Trim and Tone', upsell: 4 },
  { product: 'Fonio Mill', upsell: 0 },
  { product: 'Shred Belly', upsell: 0 },
  { product: 'Linix', upsell: 0 },
];
