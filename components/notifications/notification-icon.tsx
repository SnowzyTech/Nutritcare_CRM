import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Package,
  StickyNote,
  Truck,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { notificationIcon, type NotificationIcon as IconKey } from "@/lib/notifications/catalog";
import { cn } from "@/lib/utils";

const ICONS: Record<IconKey, LucideIcon> = {
  order: ClipboardList,
  users: Users,
  truck: Truck,
  check: CheckCircle2,
  alert: AlertTriangle,
  cancel: XCircle,
  calendar: CalendarClock,
  package: Package,
  note: StickyNote,
  money: Wallet,
  bell: Bell,
};

export function NotificationIcon({ type, className }: { type: string; className?: string }) {
  const Icon = ICONS[notificationIcon(type)];
  return <Icon className={cn("w-5 h-5", className)} />;
}

/** Accent classes for the icon bubble, by priority. */
export function priorityTone(priority: string, isRead: boolean): string {
  if (isRead) return "bg-gray-50 text-gray-400";
  if (priority === "critical") return "bg-[#ad1df4]/10 text-[#ad1df4]";
  if (priority === "high") return "bg-rose-50 text-rose-600";
  return "bg-sky-50 text-sky-600";
}
