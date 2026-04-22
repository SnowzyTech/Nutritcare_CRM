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
    label: "Inventory/Product",
    href: "/admin/inventory",
    icon: "inventory",
  },
  {
    label: "Order",
    icon: "order",
    children: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Create Order", href: "/admin/orders/create" },
    ],
  },
  {
    label: "Staff Management",
    icon: "staff",
    children: [
      { label: "All Staff", href: "/admin/staff" },
      { label: "Add Staff", href: "/admin/staff/add" },
    ],
  },
  { label: "Forms", href: "/admin/forms", icon: "forms" },
  { label: "History", href: "/admin/history", icon: "history" },
];
