import type { Metadata } from "next";
import FormsListClient from "@/components/dashboard/forms/FormsListClient";
import { getAllForms } from "@/modules/admin/services/forms.service";
import type { SavedForm } from "@/lib/formsStore";

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const dbForms = await getAllForms();
  const forms: SavedForm[] = dbForms.map((f) => ({
    id: f.id,
    formName: f.name,
    createdAt: f.createdAt.toISOString(),
    hits: f.hits,
    orders: f.orders,
    data: f.data as Record<string, unknown>,
  }));
  return <FormsListClient initialForms={forms} />;
}
