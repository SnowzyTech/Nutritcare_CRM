import type { Metadata } from "next";
import AddTemplateForm from "../../_components/add-template-form";

export const metadata: Metadata = {
  title: "Add Message Template – WhatsApp Marketing",
};

export default function NewTemplatePage() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <AddTemplateForm />
    </div>
  );
}
