export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href?: string;
  icon: string; // Changed from any to string to fix Serialization error
  children?: NavChild[];
};

export const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Chat", href: "/chat", icon: "chat" },
  { label: "Admin Overview", href: "/admin/account", icon: "account" },
  { label: "Chat Oversight", href: "/admin/chat-oversight", icon: "chat-oversight" },
  {
    label: "Order",
    icon: "order",
    children: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Order Assignment", href: "/admin/orders/order-assignment" },
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
      { label: "Media Buyer", href: "/admin/staff/media-buyer" },
      { label: "Logistics Manager", href: "/admin/staff/logistics-manager" },
      { label: "Manage Account", href: "/admin/staff/manage-account" },
      { label: "Teams", href: "/admin/staff/teams" },
      { label: "Access Control", href: "/admin/staff/admins" },
    ],
  },
  {
    label: "Staff Overview",
    icon: "overview",
    children: [
      { label: "Sales Reps", href: "/admin/overview/sales-rep" },
      { label: "Media Buyers", href: "/admin/overview/media-buyer" },
      { label: "Delivery Agents", href: "/admin/overview/delivery-agent" },
    ],
  },
  { label: "Inventory", href: "/admin/inventory", icon: "inventory" },
  { label: "Forms", href: "/admin/forms", icon: "forms" },
  { label: "History", href: "/admin/history", icon: "history" },
];
