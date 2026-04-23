"use client";

import { useState } from "react";
import {
  Plus, Trash2, FileText, User, Mail, MapPin, Map, Phone,
  ListChecks, Send, LayoutTemplate, Palette, Copy, Check,
  ChevronLeft, PenLine,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/* ── Types ── */
type FieldType = "fullName" | "email" | "fullAddress" | "state" | "phone1" | "phone2" | "packages" | "submitButton";
type PackageOption = { id: string; label: string };
type FormField =
  | { id: string; type: Exclude<FieldType, "packages" | "submitButton"> }
  | { id: string; type: "packages"; options: PackageOption[] }
  | { id: string; type: "submitButton" };

type FormStyle = {
  textColor: string;
  bgColor: string;
  fontFamily: string;
  buttonColor: string;
  buttonText: string;
};

type FormConfig = {
  id: string;
  name: string;
  fields: FormField[];
  style: FormStyle;
};

const defaultStyle: FormStyle = {
  textColor: "#334155",
  bgColor: "#ffffff",
  fontFamily: "Inter",
  buttonColor: "#8B2FE8",
  buttonText: "Submit Order",
};

const uid = () => Math.random().toString(36).slice(2, 9);

const paletteItems: { type: FieldType; label: string; icon: typeof User }[] = [
  { type: "fullName", label: "Full Name", icon: User },
  { type: "email", label: "Email Address", icon: Mail },
  { type: "fullAddress", label: "Full Address", icon: MapPin },
  { type: "state", label: "State", icon: Map },
  { type: "phone1", label: "Phone Number 1", icon: Phone },
  { type: "phone2", label: "Phone Number 2", icon: Phone },
  { type: "packages", label: "Preferred Packages", icon: ListChecks },
  { type: "submitButton", label: "Submit Button", icon: Send },
];

const fontOptions = ["Inter", "Roboto", "Poppins", "Outfit", "Lato", "Open Sans", "Nunito", "Montserrat"];

/* ══════════════════════════════════════════════════════════════ */
export function FormBuilder() {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"fields" | "style">("fields");
  const [copied, setCopied] = useState(false);

  const activeForm = forms.find(f => f.id === activeFormId);

  /* ── Form CRUD ── */
  function createForm() {
    const newForm: FormConfig = { id: uid(), name: `Form ${forms.length + 1}`, fields: [], style: { ...defaultStyle } };
    setForms(prev => [...prev, newForm]);
    setActiveFormId(newForm.id);
    setLeftTab("fields");
  }

  function deleteForm(id: string) {
    setForms(prev => prev.filter(f => f.id !== id));
    if (activeFormId === id) setActiveFormId(null);
  }

  function renameForm(id: string, name: string) {
    setForms(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }

  /* ── Field management ── */
  function updateFields(fn: (fields: FormField[]) => FormField[]) {
    setForms(prev => prev.map(f => f.id === activeFormId ? { ...f, fields: fn(f.fields) } : f));
  }

  function addField(type: FieldType) {
    if (!activeForm) return;
    if (type === "submitButton" && activeForm.fields.some(f => f.type === "submitButton")) return;
    if (type === "packages") {
      updateFields(prev => [...prev, { id: uid(), type: "packages", options: [{ id: uid(), label: "" }] }]);
    } else {
      updateFields(prev => [...prev, { id: uid(), type }]);
    }
  }

  function removeField(id: string) { updateFields(prev => prev.filter(f => f.id !== id)); }

  function updatePackageOption(fieldId: string, optionId: string, value: string) {
    updateFields(prev => prev.map(f => {
      if (f.id !== fieldId || f.type !== "packages") return f;
      return { ...f, options: f.options.map(o => o.id === optionId ? { ...o, label: value } : o) };
    }));
  }

  function addPackageOption(fieldId: string) {
    updateFields(prev => prev.map(f => {
      if (f.id !== fieldId || f.type !== "packages") return f;
      return { ...f, options: [...f.options, { id: uid(), label: "" }] };
    }));
  }

  function removePackageOption(fieldId: string, optionId: string) {
    updateFields(prev => prev.map(f => {
      if (f.id !== fieldId || f.type !== "packages") return f;
      if (f.options.length <= 1) return f;
      return { ...f, options: f.options.filter(o => o.id !== optionId) };
    }));
  }

  /* ── Style management ── */
  function updateStyle(key: keyof FormStyle, value: string) {
    setForms(prev => prev.map(f => f.id === activeFormId ? { ...f, style: { ...f.style, [key]: value } } : f));
  }

  /* ── Shortcode ── */
  function copyShortcode() {
    if (!activeForm) return;
    const code = `[nutritcare_form id="${activeForm.id}"]`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /* ════════════════════════════════════════════════════════════ */
  /* SCREEN 1 — Form List                                        */
  /* ════════════════════════════════════════════════════════════ */
  if (!activeFormId) {
    return (
      <div>
        {forms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 flex flex-col items-center justify-center">
            <FileText size={48} className="text-[#8B2FE8]" />
            <h3 className="text-xl font-bold text-slate-700 mt-4">No forms yet</h3>
            <p className="text-sm text-slate-400 mt-2 text-center max-w-xs">Click the button below to start building your first form.</p>
            <button onClick={createForm} className="mt-6 bg-[#8B2FE8] hover:bg-[#7a28d4] text-white font-semibold rounded-xl px-8 py-3 text-sm transition-colors flex items-center gap-2">
              <Plus size={16} /> Create Form
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-500">{forms.length} form{forms.length !== 1 ? "s" : ""} created</p>
              <button onClick={createForm} className="bg-[#8B2FE8] hover:bg-[#7a28d4] text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors flex items-center gap-2">
                <Plus size={16} /> New Form
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map(form => (
                <div key={form.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:border-[#8B2FE8] transition-colors group relative">
                  <button onClick={() => deleteForm(form.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4"><FileText size={20} className="text-[#8B2FE8]" /></div>
                  <h4 className="font-bold text-slate-800">{form.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{form.fields.length} field{form.fields.length !== 1 ? "s" : ""}</p>
                  <button onClick={() => { setActiveFormId(form.id); setLeftTab("fields"); }} className="mt-4 text-sm font-semibold text-[#8B2FE8] flex items-center gap-1 hover:gap-2 transition-all">
                    <PenLine size={14} /> Edit Form
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════ */
  /* SCREEN 2 — Builder                                          */
  /* ════════════════════════════════════════════════════════════ */
  const s = activeForm!.style;
  const submitExists = activeForm!.fields.some(f => f.type === "submitButton");

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveFormId(null)} className="text-slate-400 hover:text-[#8B2FE8] transition-colors"><ChevronLeft size={24} /></button>
          <input value={activeForm!.name} onChange={e => renameForm(activeForm!.id, e.target.value)} className="text-xl font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 w-[240px]" />
        </div>
        <button onClick={copyShortcode} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${copied ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-white border-slate-200 text-slate-600 hover:border-[#8B2FE8] hover:text-[#8B2FE8]"}`}>
          {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Shortcode</>}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── LEFT PANEL ── */}
        <div className="w-[320px] shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button onClick={() => setLeftTab("fields")} className={`flex-1 py-3 text-sm font-bold transition-colors ${leftTab === "fields" ? "text-[#8B2FE8] border-b-2 border-[#8B2FE8]" : "text-slate-400 hover:text-slate-600"}`}>Fields</button>
            <button onClick={() => setLeftTab("style")} className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${leftTab === "style" ? "text-[#8B2FE8] border-b-2 border-[#8B2FE8]" : "text-slate-400 hover:text-slate-600"}`}><Palette size={14} /> Style</button>
          </div>

          <div className="p-5">
            {leftTab === "fields" ? (
              <>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Add Fields</h4>
                {paletteItems.map(item => {
                  const Icon = item.icon;
                  const disabled = item.type === "submitButton" && submitExists;
                  return (
                    <button key={item.type} onClick={() => !disabled && addField(item.type)} disabled={disabled}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all mb-2 text-left ${disabled ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed" : "border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-[#8B2FE8] hover:text-[#8B2FE8] text-slate-600 cursor-pointer"}`}>
                      <Icon size={16} /> {item.label}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Customize</h4>
                {/* Text Color */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={s.textColor} onChange={e => updateStyle("textColor", e.target.value)} className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0" />
                    <Input value={s.textColor} onChange={e => updateStyle("textColor", e.target.value)} className="flex-1 text-xs font-mono" />
                  </div>
                </div>
                {/* Background Color */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={s.bgColor} onChange={e => updateStyle("bgColor", e.target.value)} className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0" />
                    <Input value={s.bgColor} onChange={e => updateStyle("bgColor", e.target.value)} className="flex-1 text-xs font-mono" />
                  </div>
                </div>
                {/* Button Color */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Button Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={s.buttonColor} onChange={e => updateStyle("buttonColor", e.target.value)} className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0" />
                    <Input value={s.buttonColor} onChange={e => updateStyle("buttonColor", e.target.value)} className="flex-1 text-xs font-mono" />
                  </div>
                </div>
                {/* Button Text */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Button Text</label>
                  <Input value={s.buttonText} onChange={e => updateStyle("buttonText", e.target.value)} placeholder="Submit Order" />
                </div>
                {/* Font Family */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Font Family</label>
                  <select value={s.fontFamily} onChange={e => updateStyle("fontFamily", e.target.value)} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:border-[#8B2FE8]">
                    {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL — Canvas ── */}
        <div className="flex-1 rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[500px]" style={{ backgroundColor: s.bgColor, fontFamily: s.fontFamily, color: s.textColor }}>
          {activeForm!.fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <LayoutTemplate size={40} />
              <p className="mt-3 text-sm">Click a field on the left to add it here</p>
            </div>
          ) : (
            activeForm!.fields.map(field => (
              <div key={field.id} className="bg-white/60 border border-slate-200 rounded-xl p-4 mb-4 relative group backdrop-blur-sm">
                <button onClick={() => removeField(field.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={16} /></button>

                {field.type === "fullName" && (
                  <><label className="block text-sm font-semibold mb-2" style={{ color: s.textColor }}>Full Name *</label><Input type="text" placeholder="Enter full name" className="bg-white" /></>
                )}
                {field.type === "email" && (
                  <><label className="block text-sm font-semibold mb-2" style={{ color: s.textColor }}>Email Address *</label><Input type="email" placeholder="Enter email address" className="bg-white" /></>
                )}
                {field.type === "fullAddress" && (
                  <><label className="block text-sm font-semibold mb-2" style={{ color: s.textColor }}>Full Address *</label><Input type="text" placeholder="Enter full address" className="bg-white" /></>
                )}
                {field.type === "state" && (
                  <><label className="block text-sm font-semibold mb-2" style={{ color: s.textColor }}>State *</label><Input type="text" placeholder="Enter your state" className="bg-white" /></>
                )}
                {field.type === "phone1" && (
                  <><label className="block text-sm font-semibold mb-2" style={{ color: s.textColor }}>Phone Number 1 *</label><Input type="tel" placeholder="Enter phone number" className="bg-white" /></>
                )}
                {field.type === "phone2" && (
                  <><label className="block text-sm font-semibold mb-2" style={{ color: s.textColor }}>Phone Number 2 *</label><Input type="tel" placeholder="Enter second phone number" className="bg-white" /></>
                )}
                {field.type === "packages" && (
                  <>
                    <label className="block text-sm font-semibold mb-3" style={{ color: s.textColor }}>Choose Your Preferred Packages *</label>
                    <div className="space-y-2">
                      {field.options.map(opt => (
                        <div key={opt.id} className="flex items-center gap-3">
                          <input type="radio" disabled className="accent-[#8B2FE8] w-4 h-4 shrink-0" />
                          <Input value={opt.label} onChange={e => updatePackageOption(field.id, opt.id, e.target.value)} placeholder="Enter package option" className="flex-1 bg-white" />
                          {field.options.length > 1 && (
                            <button onClick={() => removePackageOption(field.id, opt.id)} className="text-red-400 hover:text-red-600 transition-colors p-1 shrink-0"><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addPackageOption(field.id)} className="mt-2 text-xs font-semibold text-[#8B2FE8] border border-[#8B2FE8] rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors flex items-center gap-1">
                      <Plus size={12} /> Add Option
                    </button>
                  </>
                )}
                {field.type === "submitButton" && (
                  <button disabled className="w-full text-white font-semibold rounded-xl py-3 text-sm cursor-default" style={{ backgroundColor: s.buttonColor }}>
                    {s.buttonText}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
