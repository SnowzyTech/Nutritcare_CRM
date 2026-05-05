export interface AgentSettlement {
  id: string;
  agentName: string;
  state: string;
  totalSalesValue: string;
  delFeesEarned: string;
  totalRemitted: string;
  balance: string;
  overpayment: string;
  underpayment: string;
  date: string;
}

export interface AgentLedgerEntry {
  id: string;
  date: string;
  agent: string;
  avatar?: string;
  referenceType: 'Remittance' | 'Delivery Fee' | 'Adjustment';
  referenceId: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export const agentSettlementsData: AgentSettlement[] = [
  {
    id: '1',
    agentName: 'Ibrahim Lawal',
    state: 'Kano',
    totalSalesValue: '₦1,240,000',
    delFeesEarned: '₦42,000',
    totalRemitted: '₦1,250,000',
    balance: '₦1,282,000',
    overpayment: '₦0',
    underpayment: '₦1,500',
    date: '2026-03-02'
  },
  {
    id: '2',
    agentName: 'Emeka Nwosu',
    state: 'Rivers',
    totalSalesValue: '₦860,000',
    delFeesEarned: '₦28,500',
    totalRemitted: '₦887,900',
    balance: '₦888,500',
    overpayment: '₦0',
    underpayment: '₦600',
    date: '2026-03-03'
  },
  {
    id: '3',
    agentName: 'Yusuf Sani',
    state: 'Kaduna',
    totalSalesValue: '₦1,020,000',
    delFeesEarned: '₦35,200',
    totalRemitted: '₦1,055,800',
    balance: '₦1,055,200',
    overpayment: '₦600',
    underpayment: '₦0',
    date: '2026-03-04'
  },
  {
    id: '4',
    agentName: 'Samuel Etim',
    state: 'Akwa Ibom',
    totalSalesValue: '₦730,000',
    delFeesEarned: '₦22,800',
    totalRemitted: '₦752,200',
    balance: '₦752,800',
    overpayment: '₦0',
    underpayment: '₦600',
    date: '2026-03-05'
  },
  {
    id: '5',
    agentName: 'Ibrahim Lawal',
    state: 'Kano',
    totalSalesValue: '₦1,240,000',
    delFeesEarned: '₦42,000',
    totalRemitted: '₦1,250,000',
    balance: '₦1,282,000',
    overpayment: '₦0',
    underpayment: '₦1,500',
    date: '2026-03-02'
  },
  {
    id: '6',
    agentName: 'Emeka Nwosu',
    state: 'Rivers',
    totalSalesValue: '₦860,000',
    delFeesEarned: '₦28,500',
    totalRemitted: '₦887,900',
    balance: '₦888,500',
    overpayment: '₦0',
    underpayment: '₦600',
    date: '2026-03-03'
  }
];

export const agentLedgerData: AgentLedgerEntry[] = [
  {
    id: '1',
    date: '2026-03-01',
    agent: 'Ibrahim Lawal',
    referenceType: 'Remittance',
    referenceId: 'REM-1023',
    debit: '₦0',
    credit: '₦45,000',
    runningBalance: '₦45,000'
  },
  {
    id: '2',
    date: '2026-03-02',
    agent: 'Flymack | Lagos',
    referenceType: 'Delivery Fee',
    referenceId: 'DF-204',
    debit: '₦2,500',
    credit: '₦0',
    runningBalance: '₦42,500'
  },
  {
    id: '3',
    date: '2026-03-01',
    agent: 'Qudus Aina',
    referenceType: 'Adjustment',
    referenceId: 'ADJ-001',
    debit: '₦30,000',
    credit: '₦45,000',
    runningBalance: '₦45,000'
  },
  {
    id: '4',
    date: '2026-03-02',
    agent: 'Oyelowo John',
    referenceType: 'Delivery Fee',
    referenceId: 'DF-204',
    debit: '₦2,500',
    credit: '₦0',
    runningBalance: '₦42,500'
  },
  {
    id: '5',
    date: '2026-03-01',
    agent: 'Mrs. Sumni',
    referenceType: 'Remittance',
    referenceId: 'REM-1023',
    debit: '₦0',
    credit: '₦45,000',
    runningBalance: '₦45,000'
  }
];
