"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowLeft, Copy, CheckCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAgentAction } from "@/modules/delivery/actions/logistics-agents.action";

type Credentials = {
  name: string;
  email: string;
  tempPassword: string;
};

export default function AddAgentPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [picksFromOffice, setPicksFromOffice] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [locations, setLocations] = useState([""]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const addLocation = () => setLocations([...locations, ""]);
  const removeLocation = (index: number) => {
    if (locations.length > 1) setLocations(locations.filter((_, i) => i !== index));
  };
  const updateLocation = (index: number, value: string) => {
    setLocations(locations.map((l, i) => (i === index ? value : l)));
  };

  const handleReset = () => {
    setName(""); setAddress(""); setPhone(""); setPhone2(""); setPhone3("");
    setPicksFromOffice(""); setCountry("Nigeria"); setState(""); setEmail("");
    setLocations([""]); setError("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) return setError("Agent name is required.");
    if (!phone.trim()) return setError("Phone 1 is required.");
    if (!email.trim()) return setError("Email is required.");

    setLoading(true);
    const statesCovered = locations.filter((l) => l.trim() !== "");

    const result = await createAgentAction({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      phone2: phone2.trim() || undefined,
      phone3: phone3.trim() || undefined,
      address: address.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || undefined,
      statesCovered,
      picksFromOfficeStock: picksFromOffice === "yes",
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setCredentials(result.data);
      handleReset();
    }
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(
      `Agent Credentials\nName: ${credentials.name}\nEmail: ${credentials.email}\nTemporary Password: ${credentials.tempPassword}\n\nPlease log in and change your password immediately.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-800">Agent Created Successfully</h2>
              <p className="text-xs text-gray-500">
                Copy these credentials and send them to the account owner. The password cannot be retrieved again.
              </p>
            </div>

            <div className="bg-[#faf5ff] rounded-xl p-5 space-y-3 border border-[#e9d5ff]">
              <CredRow label="Name" value={credentials.name} />
              <CredRow label="Email" value={credentials.email} />
              <CredRow label="Temporary Password" value={credentials.tempPassword} mono />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCopyCredentials}
                className="flex-1 bg-[#ad1df4] hover:bg-[#8e14cc] text-white gap-2"
              >
                {copied ? (
                  <><CheckCheck className="w-4 h-4" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy All</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCredentials(null)}
                className="flex-1 border-gray-300 text-gray-600"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button & Header */}
      <div className="space-y-4">
        <Link
          href="/logistics/agents"
          className="flex items-center gap-2 text-gray-500 hover:text-[#ad1df4] transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">Add Agent</h1>
            <span className="text-xs font-bold text-gray-400">NEW</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={handleReset}
              className="bg-[#d1d5db] hover:bg-[#9ca3af] text-white px-10 font-bold h-10 rounded-md"
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-10 font-bold h-10 rounded-md disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Agent"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Company/Agent Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Address</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Does Agent Pick from Office Stock?
            </label>
            <Select value={picksFromOffice} onValueChange={(v) => setPicksFromOffice(v ?? "")}>
              <SelectTrigger className="h-11 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Phone 1 (No Country Code) <span className="text-red-500">*</span>
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Must be unique"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Phone 2</label>
            <Input
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              placeholder="Optional"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Phone 3</label>
            <Input
              value={phone3}
              onChange={(e) => setPhone3(e.target.value)}
              placeholder="Optional"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Country</label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Nigeria"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Main State
            </label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Lagos State"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
        </div>

        {/* Row 4: Locations */}
        <div className="grid grid-cols-3 gap-8 pt-2">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-700 uppercase">
                Locations / States Covered
              </label>
              <button
                onClick={addLocation}
                className="text-[#ad1df4] hover:text-[#8e14cc] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {locations.map((loc, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={loc}
                    onChange={(e) => updateLocation(index, e.target.value)}
                    placeholder={`Location ${index + 1}`}
                    className="bg-white border-gray-200 h-10 text-xs focus:ring-[#ad1df4] flex-1"
                  />
                  {locations.length > 1 && (
                    <button
                      onClick={() => removeLocation(index)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Login Password
            </label>
            <div className="h-11 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-400 italic">
              Auto-generated on save
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0">{label}:</span>
      <span
        className={`text-xs text-gray-800 font-semibold text-right break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
