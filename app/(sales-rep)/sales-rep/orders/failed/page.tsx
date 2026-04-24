import { redirect } from "next/navigation";

export default function FailedOrdersPage() {
  redirect("/sales-rep/orders");
}
