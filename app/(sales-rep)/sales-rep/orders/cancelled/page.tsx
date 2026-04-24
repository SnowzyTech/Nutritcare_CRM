import { redirect } from "next/navigation";

export default function CancelledOrdersPage() {
  redirect("/sales-rep/orders");
}
