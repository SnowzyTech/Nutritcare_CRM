import type { Metadata } from "next";
import NewCampaignForm from "../../_components/new-campaign-form";

export const metadata: Metadata = {
  title: "New Campaign – WhatsApp Marketing",
};

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <NewCampaignForm />
    </div>
  );
}
