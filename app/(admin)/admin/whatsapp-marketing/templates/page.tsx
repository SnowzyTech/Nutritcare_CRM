import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Message Templates – WhatsApp Marketing" };

const templateRows = [
  {
    templateName: "adewale.johnson.ng@gmail.com",
    preview: "Adewale Johnson",
    status: "",
    created: "Blessing Efiong",
    lastModified: "Prosxact",
    quantity: 3,
  },
  {
    templateName: "ibrahim.musa.ng@gmail.co",
    preview: "Ibrahim Musa",
    status: "Mr. Ola",
    created: "Adebimpe Tolani",
    lastModified: "Fonio-Mill",
    quantity: 5,
  },
  {
    templateName: "chinedu.okafor.ng@gmail.c",
    preview: "Chinedu Okafor",
    status: "Mr. Qudus",
    created: "Mr. Qudus",
    lastModified: "Trim and Tone",
    quantity: 4,
  },
  {
    templateName: "funke.adebayo.ng@gmail.c",
    preview: "Funke Adebayo",
    status: "",
    created: "Funmilayo Ogunleye",
    lastModified: "Shred Belly",
    quantity: 2,
  },
  {
    templateName: "blessing.eze.ng@gmail.con",
    preview: "Blessing Eze",
    status: "Mr. Oyelowo",
    created: "Mr. Oyelowo",
    lastModified: "Neuro-Vive Balm",
    quantity: 1,
  },
  {
    templateName: "sola.ogunleye.ng@gmail.cc",
    preview: "Sola Ogunleye",
    status: "",
    created: "Zainab Bello",
    lastModified: "Prosxact",
    quantity: 3,
  },
  {
    templateName: "victor.uche.ng@gmail.com",
    preview: "Victor Uche",
    status: "",
    created: "Emeka Nwankwo",
    lastModified: "Fonio-Mill",
    quantity: 7,
  },
  {
    templateName: "victor.uche.ng@gmail.com",
    preview: "Victor Uche",
    status: "Mrs. Sunmi",
    created: "Blessing Efiong",
    lastModified: "Fonio-Mill",
    quantity: 7,
  },
  {
    templateName: "victor.uche.ng@gmail.com",
    preview: "Victor Uche",
    status: "Mrs. Sunmi",
    created: "Mrs. Sunmi",
    lastModified: "Fonio-Mill",
    quantity: 7,
  },
];

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="min-w-0 space-y-[14px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold text-[#333333]">
            Message Templates
          </h1>
          <Link
            href="/admin/whatsapp-marketing/templates/new"
            className="flex h-[40px] items-center gap-2 rounded-[8px] bg-[#a400f6] px-[22px] text-[12px] font-bold text-white transition-colors hover:bg-[#9000dd]"
          >
            <Plus size={14} strokeWidth={3} />
            Add New Message Template
          </Link>
        </div>

        {/* Table */}
        <section className="rounded-[10px] border border-[#ececec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#eeeeee]">
                  <th className="px-[22px] py-[16px] text-left text-[13px] font-bold text-[#333333]">
                    Template Name
                  </th>
                  <th className="px-[14px] py-[16px] text-left text-[13px] font-bold text-[#333333]">
                    Preview
                  </th>
                  <th className="px-[14px] py-[16px] text-left text-[13px] font-bold text-[#333333]">
                    Status
                  </th>
                  <th className="px-[14px] py-[16px] text-left text-[13px] font-bold text-[#333333]">
                    Created
                  </th>
                  <th className="px-[14px] py-[16px] text-left text-[13px] font-bold text-[#333333]">
                    Last Modified
                  </th>
                  <th className="px-[14px] py-[16px] text-left text-[13px] font-bold text-[#333333]">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {templateRows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#f5f5f5] last:border-b-0 transition-colors hover:bg-[#fafafa]"
                  >
                    <td className="max-w-[200px] truncate px-[22px] py-[14px] text-[13px] text-[#555555]">
                      {row.templateName}
                    </td>
                    <td className="px-[14px] py-[14px] text-[13px] text-[#555555]">
                      {row.preview}
                    </td>
                    <td className="px-[14px] py-[14px] text-[13px] text-[#555555]">
                      {row.status}
                    </td>
                    <td className="px-[14px] py-[14px] text-[13px] text-[#555555]">
                      {row.created}
                    </td>
                    <td className="px-[14px] py-[14px] text-[13px] text-[#555555]">
                      {row.lastModified}
                    </td>
                    <td className="px-[14px] py-[14px] text-left text-[13px] font-semibold text-[#333333]">
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
