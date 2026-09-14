import { notFound } from "next/navigation";
import type { SavedForm } from "@/lib/formsStore";
import { getPublicFormById } from "@/modules/admin/services/forms.service";
import OrderFormClient from "./order-form-client";

/**
 * Server component: fetches the form on the server so its fields/prices/product
 * arrive built into the first HTML response. This removes the second client-side
 * round trip (and the loading spinner) the embedded form used to make, so it
 * appears near-instantly even on weak networks.
 */
export default async function OrderFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getPublicFormById(id);
  if (!form) notFound();

  const initialForm: SavedForm = {
    id: form.id,
    formName: form.name,
    createdAt: form.createdAt,
    hits: form.hits,
    orders: form.orders,
    data: form.data,
  };

  return <OrderFormClient formId={id} initialForm={initialForm} />;
}
