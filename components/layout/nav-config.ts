export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href?: string;
  icon: string; // Changed from any to string to fix Serialization error
  children?: NavChild[];
};

export const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Account", href: "/admin/account", icon: "account" },
  {
    label: "Order",
    icon: "order",
    children: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Order Assignment", href: "/admin/orders/order-assignment" },
    ],
  },
  {
    label: "WhatsApp Marketing",
    icon: "whatsapp",
    children: [
      { label: "Dashboard", href: "/admin/whatsapp-marketing" },
      { label: "Templates", href: "/admin/whatsapp-marketing/templates" },
      { label: "Flows", href: "/admin/whatsapp-marketing/flows" },
      { label: "Quick Reply", href: "/admin/whatsapp-marketing/quick-reply" },
      { label: "Contacts", href: "/admin/whatsapp-marketing/contacts" },
      { label: "Campaigns", href: "/admin/whatsapp-marketing/campaigns" },
      { label: "Automation", href: "/admin/whatsapp-marketing/automation" },
      {
        label: "Drip Sequence",
        href: "/admin/whatsapp-marketing/drip-sequence",
      },
      { label: "Analytics", href: "/admin/whatsapp-marketing/analytics" },
      { label: "Inbox", href: "/admin/whatsapp-marketing/inbox" },
    ],
  },
  {
    label: "Staff Management",
    icon: "staff",
    children: [
      { label: "Sales Rep", href: "/admin/staff/sales-rep" },
      { label: "Delivery Agent", href: "/admin/staff/delivery-agent" },
      { label: "Inventory Manager", href: "/admin/staff/inventory-manager" },
      { label: "Accountant", href: "/admin/staff/accountant" },
      { label: "Warehouse Manager", href: "/admin/staff/warehouse-manager" },
      { label: "Data Analyst", href: "/admin/staff/data-analyst" },
      { label: "Logistics Manager", href: "/admin/staff/logistics-manager" },
      { label: "Manage Account", href: "/admin/staff/manage-account" },
      { label: "Teams", href: "/admin/staff/teams" },
    ],
  },
  { label: "Inventory", href: "/admin/inventory", icon: "inventory" },
  { label: "Forms", href: "/admin/forms", icon: "forms" },
  { label: "History", href: "/admin/history", icon: "history" },
];
