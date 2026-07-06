"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Power, ArrowRight, Loader2 } from "lucide-react";
import { setFormDisabledAction } from "@/modules/admin/actions/forms.action";

export function FormDetailActions({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !disabled;
    if (next && !confirm("Disable this form? It will stop accepting new orders until re-enabled.")) {
      return;
    }
    setBusy(true);
    const res = await setFormDisabledAction(id, next);
    if ("error" in res) {
      alert(res.error);
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/media-buyer/forms/${id}/edit`}
        className="inline-flex items-center gap-2 bg-[#8B2FE8] hover:bg-[#7a26cf] text-white text-sm font-bold rounded-xl px-5 py-3 transition-colors shadow-md shadow-purple-200/70"
      >
        <Pencil size={15} />
        Edit Form
      </Link>
      <button
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl px-5 py-3 transition-colors shadow-md disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${
          disabled
            ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200/70"
            : "bg-red-500 hover:bg-red-600 shadow-red-200/70"
        }`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
        {disabled ? "Enable" : "Disable"}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
