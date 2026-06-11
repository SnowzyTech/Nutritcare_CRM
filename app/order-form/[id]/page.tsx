"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { SavedForm } from "@/lib/formsStore";
import { Check, Copy, Sparkles, ShoppingBag, CreditCard, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

/* ── Nigerian States List ── */
const NIGERIAN_STATES = [
  "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State", "Bauchi State",
  "Bayelsa State", "Benue State", "Borno State", "Cross River State", "Delta State",
  "Ebonyi State", "Edo State", "Ekiti State", "Enugu State", "Gombe State", "Imo State",
  "Jigawa State", "Kaduna State", "Kano State", "Katsina State", "Kebbi State", "Kogi State",
  "Kwara State", "Lagos State", "Nasarawa State", "Niger State", "Ogun State", "Ondo State",
  "Osun State", "Oyo State", "Plateau State", "Rivers State", "Sokoto State", "Taraba State",
  "Yobe State", "Zamfara State", "Federal Capital Territory (FCT)",
];

/* ── Order the customer fields are displayed in, regardless of saved key order ──
   name → email → address → state → phone → whatsapp. Any unlisted field falls
   to the end, keeping its relative order. */
const FIELD_DISPLAY_ORDER = ["name", "email", "address", "state", "phone", "whatsapp"];
const fieldOrderIndex = (key: string) => {
  const i = FIELD_DISPLAY_ORDER.indexOf(key);
  return i === -1 ? FIELD_DISPLAY_ORDER.length : i;
};



/* ── Country Dialing Codes ── */
const COUNTRIES_AND_CODES = [
  { name: "Nigeria", code: "+234" },
  { name: "Afghanistan", code: "+93" },
  { name: "Aland Islands", code: "+358-18" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "American Samoa", code: "+1-684" },
  { name: "Andorra", code: "+376" },
  { name: "Angola", code: "+244" },
  { name: "Anguilla", code: "+1-264" },
  { name: "Antarctica", code: "+672" },
  { name: "Antigua And Barbuda", code: "+1-268" },
  { name: "Argentina", code: "+54" },
  { name: "Armenia", code: "+374" },
  { name: "Aruba", code: "+297" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Azerbaijan", code: "+994" },
  { name: "Bahamas", code: "+1-242" },
  { name: "Bahrain", code: "+973" },
  { name: "Bangladesh", code: "+880" },
  { name: "Barbados", code: "+1-246" },
  { name: "Belarus", code: "+375" },
  { name: "Belgium", code: "+32" },
  { name: "Belize", code: "+501" },
  { name: "Benin", code: "+229" },
  { name: "Bermuda", code: "+1-441" },
  { name: "Bhutan", code: "+975" },
  { name: "Bolivia", code: "+591" },
  { name: "Bosnia And Herzegovina", code: "+387" },
  { name: "Botswana", code: "+267" },
  { name: "Brazil", code: "+55" },
  { name: "British Indian Ocean Territory", code: "+246" },
  { name: "Brunei Darussalam", code: "+673" },
  { name: "Bulgaria", code: "+359" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cambodia", code: "+855" },
  { name: "Cameroon", code: "+237" },
  { name: "Canada", code: "+1" },
  { name: "Cape Verde", code: "+238" },
  { name: "Cayman Islands", code: "+1-345" },
  { name: "Central African Republic", code: "+236" },
  { name: "Chad", code: "+235" },
  { name: "Chile", code: "+56" },
  { name: "China", code: "+86" },
  { name: "Christmas Island", code: "+61" },
  { name: "Cocos (Keeling) Islands", code: "+61" },
  { name: "Colombia", code: "+57" },
  { name: "Comoros", code: "+269" },
  { name: "Congo", code: "+242" },
  { name: "Congo, Democratic Republic", code: "+243" },
  { name: "Cook Islands", code: "+682" },
  { name: "Costa Rica", code: "+506" },
  { name: "Cote D'Ivoire", code: "+225" },
  { name: "Croatia", code: "+385" },
  { name: "Cuba", code: "+53" },
  { name: "Cyprus", code: "+357" },
  { name: "Czech Republic", code: "+420" },
  { name: "Denmark", code: "+45" },
  { name: "Djibouti", code: "+253" },
  { name: "Dominica", code: "+1-767" },
  { name: "Dominican Republic", code: "+1-809" },
  { name: "Ecuador", code: "+593" },
  { name: "Egypt", code: "+20" },
  { name: "El Salvador", code: "+503" },
  { name: "Equatorial Guinea", code: "+240" },
  { name: "Eritrea", code: "+291" },
  { name: "Estonia", code: "+372" },
  { name: "Ethiopia", code: "+251" },
  { name: "Falkland Islands", code: "+500" },
  { name: "Faroe Islands", code: "+298" },
  { name: "Fiji", code: "+679" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "French Guiana", code: "+594" },
  { name: "French Polynesia", code: "+689" },
  { name: "Gabon", code: "+241" },
  { name: "Gambia", code: "+220" },
  { name: "Georgia", code: "+995" },
  { name: "Germany", code: "+49" },
  { name: "Ghana", code: "+233" },
  { name: "Gibraltar", code: "+350" },
  { name: "Greece", code: "+30" },
  { name: "Greenland", code: "+299" },
  { name: "Grenada", code: "+1-473" },
  { name: "Guadeloupe", code: "+590" },
  { name: "Guam", code: "+1-671" },
  { name: "Guatemala", code: "+502" },
  { name: "Guernsey", code: "+44" },
  { name: "Guinea", code: "+224" },
  { name: "Guinea-Bissau", code: "+245" },
  { name: "Guyana", code: "+592" },
  { name: "Haiti", code: "+509" },
  { name: "Honduras", code: "+504" },
  { name: "Hong Kong", code: "+852" },
  { name: "Hungary", code: "+36" },
  { name: "Iceland", code: "+354" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Isle of Man", code: "+44" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Jamaica", code: "+1-876" },
  { name: "Japan", code: "+81" },
  { name: "Jersey", code: "+44" },
  { name: "Jordan", code: "+962" },
  { name: "Kazakhstan", code: "+7" },
  { name: "Kenya", code: "+254" },
  { name: "Kiribati", code: "+686" },
  { name: "Korea, North", code: "+850" },
  { name: "Korea, South", code: "+82" },
  { name: "Kuwait", code: "+965" },
  { name: "Kyrgyzstan", code: "+996" },
  { name: "Laos", code: "+856" },
  { name: "Latvia", code: "+371" },
  { name: "Lebanon", code: "+961" },
  { name: "Lesotho", code: "+266" },
  { name: "Liberia", code: "+231" },
  { name: "Libya", code: "+218" },
  { name: "Liechtenstein", code: "+423" },
  { name: "Lithuania", code: "+370" },
  { name: "Luxembourg", code: "+352" },
  { name: "Macao", code: "+853" },
  { name: "Macedonia", code: "+389" },
  { name: "Madagascar", code: "+261" },
  { name: "Malawi", code: "+265" },
  { name: "Malaysia", code: "+60" },
  { name: "Maldives", code: "+960" },
  { name: "Mali", code: "+223" },
  { name: "Malta", code: "+356" },
  { name: "Marshall Islands", code: "+692" },
  { name: "Martinique", code: "+596" },
  { name: "Mauritania", code: "+222" },
  { name: "Mauritius", code: "+230" },
  { name: "Mayotte", code: "+262" },
  { name: "Mexico", code: "+52" },
  { name: "Micronesia", code: "+691" },
  { name: "Moldova", code: "+373" },
  { name: "Monaco", code: "+377" },
  { name: "Mongolia", code: "+976" },
  { name: "Montenegro", code: "+382" },
  { name: "Montserrat", code: "+1-664" },
  { name: "Morocco", code: "+212" },
  { name: "Mozambique", code: "+258" },
  { name: "Myanmar", code: "+95" },
  { name: "Namibia", code: "+264" },
  { name: "Nauru", code: "+674" },
  { name: "Nepal", code: "+977" },
  { name: "Netherlands", code: "+31" },
  { name: "New Caledonia", code: "+687" },
  { name: "New Zealand", code: "+64" },
  { name: "Nicaragua", code: "+505" },
  { name: "Niger", code: "+227" },
  { name: "Niue", code: "+683" },
  { name: "Norfolk Island", code: "+672" },
  { name: "Northern Mariana Islands", code: "+1-670" },
  { name: "Norway", code: "+47" },
  { name: "Oman", code: "+968" },
  { name: "Pakistan", code: "+92" },
  { name: "Palau", code: "+680" },
  { name: "Palestinian Territory", code: "+970" },
  { name: "Panama", code: "+507" },
  { name: "Papua New Guinea", code: "+675" },
  { name: "Paraguay", code: "+595" },
  { name: "Peru", code: "+51" },
  { name: "Philippines", code: "+63" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Puerto Rico", code: "+1-787" },
  { name: "Qatar", code: "+974" },
  { name: "Reunion", code: "+262" },
  { name: "Romania", code: "+40" },
  { name: "Russian Federation", code: "+7" },
  { name: "Rwanda", code: "+250" },
  { name: "Saint Helena", code: "+290" },
  { name: "Saint Kitts and Nevis", code: "+1-869" },
  { name: "Saint Lucia", code: "+1-758" },
  { name: "Saint Pierre and Miquelon", code: "+508" },
  { name: "Saint Vincent and Grenadines", code: "+1-784" },
  { name: "Samoa", code: "+685" },
  { name: "San Marino", code: "+378" },
  { name: "Sao Tome and Principe", code: "+239" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Senegal", code: "+221" },
  { name: "Serbia", code: "+381" },
  { name: "Seychelles", code: "+248" },
  { name: "Sierra Leone", code: "+232" },
  { name: "Singapore", code: "+65" },
  { name: "Slovakia", code: "+421" },
  { name: "Slovenia", code: "+386" },
  { name: "Solomon Islands", code: "+677" },
  { name: "Somalia", code: "+252" },
  { name: "South Africa", code: "+27" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sudan", code: "+249" },
  { name: "Suriname", code: "+597" },
  { name: "Swaziland", code: "+268" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Syrian Arab Republic", code: "+963" },
  { name: "Taiwan", code: "+886" },
  { name: "Tajikistan", code: "+992" },
  { name: "Tanzania", code: "+255" },
  { name: "Thailand", code: "+66" },
  { name: "Timor-Leste", code: "+670" },
  { name: "Togo", code: "+228" },
  { name: "Tokelau", code: "+690" },
  { name: "Tonga", code: "+676" },
  { name: "Trinidad and Tobago", code: "+1-868" },
  { name: "Tunisia", code: "+216" },
  { name: "Turkey", code: "+90" },
  { name: "Turkmenistan", code: "+993" },
  { name: "Turks and Caicos Islands", code: "+1-649" },
  { name: "Tuvalu", code: "+688" },
  { name: "Uganda", code: "+256" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Uruguay", code: "+598" },
  { name: "Uzbekistan", code: "+998" },
  { name: "Vanuatu", code: "+678" },
  { name: "Venezuela", code: "+58" },
  { name: "Vietnam", code: "+84" },
  { name: "Virgin Islands, British", code: "+1-284" },
  { name: "Virgin Islands, U.S.", code: "+1-340" },
  { name: "Wallis and Futuna", code: "+681" },
  { name: "Yemen", code: "+967" },
  { name: "Zambia", code: "+260" },
  { name: "Zimbabwe", code: "+263" }
];

/* ── Interactive Field row shown in the preview form ── */

function FormField({
  label,
  placeholder,
  type = "text",
  required,
  value,
  onChange,
  labelColor,
  showCountryCode,
  countryCodeValue,
  onCountryCodeChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  labelColor: string;
  showCountryCode?: boolean;
  countryCodeValue?: string;
  onCountryCodeChange?: (code: string) => void;
}) {
  return (
    <div className="mb-4 text-left">
      <label className="block text-sm font-semibold mb-1" style={{ color: labelColor }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-stretch gap-2">
        {showCountryCode && countryCodeValue && onCountryCodeChange && (
          <div className="relative flex-shrink-0 min-w-[100px] border border-gray-300 rounded-md bg-white hover:border-gray-400 focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-500 transition-all flex items-center justify-between px-3">
            <span className="font-bold text-sm text-gray-800 select-none">{countryCodeValue}</span>
            <ChevronDown size={14} className="text-gray-500 flex-shrink-0 ml-1" />
            <select
              value={countryCodeValue}
              onChange={(e) => onCountryCodeChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              {COUNTRIES_AND_CODES.map((item, idx) => (
                <option key={`${item.name}-${item.code}-${idx}`} value={item.code} className="text-gray-800 font-medium">
                  {item.code} ({item.name})
                </option>
              ))}
            </select>
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
        />
      </div>
    </div>
  );
}

type PriceVariation = { id: string; name: string; price: number; formattedPrice: string; productId?: string; quantity?: number; };

export default function OrderFormPreview() {
  const params = useParams();
  const formId = params.id as string;
  const [form, setForm] = useState<SavedForm | null>(null);
  const [notFound, setNotFound] = useState(false);
  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  // Navigation states for testing the funnel flow
  const [activeTab, setActiveTab] = useState<"optin" | "order" | "upsell">("order");
  const [funnelStep, setFunnelStep] = useState<"active" | "success">("active");
  const [activeUpsellIndex, setActiveUpsellIndex] = useState(0);

  // Field value states for testing the inputs
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [optinValues, setOptinValues] = useState<Record<string, string>>({});

  // Country code states
  const [phoneCountryCode, setPhoneCountryCode] = useState("+234");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("+234");
  const [optinWhatsappCountryCode, setOptinWhatsappCountryCode] = useState("+234");
  
  // Payment states
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [orderBumpChecked, setOrderBumpChecked] = useState(false);

  // Selected product quantity/package option state
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  // Selected upsell package option state
  const [selectedUpsellPackage, setSelectedUpsellPackage] = useState<string>("");

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Submission loading state
  const [submitting, setSubmitting] = useState(false);

  // Confirmed order number from API
  const [orderNumber, setOrderNumber] = useState<string>("");

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/forms/${formId}`);
        if (!res.ok) { setNotFound(true); return; }
        const dbForm = await res.json();

        const found: SavedForm = {
          id: dbForm.id,
          formName: dbForm.name,
          createdAt: dbForm.createdAt,
          hits: dbForm.hits,
          orders: dbForm.orders,
          data: dbForm.data,
        };

        setForm(found);
        const data = found.data as Record<string, any>;

        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get("tab") as "optin" | "order" | "upsell" | null;
        const indexParam = parseInt(searchParams.get("index") || "0", 10);

        if (tabParam === "optin" || tabParam === "order" || tabParam === "upsell") {
          setActiveTab(tabParam);
          if (tabParam === "upsell") setActiveUpsellIndex(indexParam);
        } else if (data.createOptinForm === "Yes") {
          setActiveTab("optin");
        } else {
          setActiveTab("order");
        }

        if (data.paystackEnabled) setSelectedPayment("paystack");
        else if (data.flutterwaveEnabled) setSelectedPayment("flutterwave");
        else if (data.bankTransferEnabled) setSelectedPayment("bank_transfer");
        else if (data.payOnDeliveryEnabled) setSelectedPayment("pay_on_delivery");

        const mainVariations = (data.priceVariations as PriceVariation[] | undefined) ?? [];
        if (mainVariations.length > 0) setSelectedPackage(mainVariations[0].name);

        if (data.addUpsell === "Yes" && data.upsellItems && data.upsellItems.length > 0) {
          const activeIdx =
            tabParam === "upsell" && indexParam >= 0 && indexParam < data.upsellItems.length
              ? indexParam
              : 0;
          const upsellVariations = (data.upsellItems[activeIdx]?.priceVariations as PriceVariation[] | undefined) ?? [];
          if (upsellVariations.length > 0) setSelectedUpsellPackage(upsellVariations[0].name);
        }
      } catch {
        setNotFound(true);
      }
    }

    loadForm();
  }, [formId]);

  // Post content height to parent frame for auto-resizing iframes.
  // Must stay here — before any conditional returns — to satisfy Rules of Hooks.
  useEffect(() => {
    const el = document.getElementById("nc-order-form-root");
    if (!el) return;
    const postHeight = () => {
      window.parent.postMessage({ type: "nc-resize", height: el.scrollHeight }, "*");
    };
    postHeight();
    const ro = new ResizeObserver(postHeight);
    ro.observe(el);
    return () => ro.disconnect();
  });

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-md border border-gray-200 space-y-4">
          <p className="text-2xl font-black text-gray-800">Form Not Found</p>
          <p className="text-gray-500 text-sm leading-relaxed">
            This form may have been deleted or does not exist.
          </p>
          {isIframe && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl p-4 text-left space-y-2">
              <span className="font-bold text-sm block">💡 Elementor / WordPress Embed Note</span>
              <p className="leading-relaxed">
                Because the CRM is currently in **pure front-end local storage mode**, browsers isolate and sandbox the iframe's storage relative to your Elementor parent site.
              </p>
              <p className="font-semibold">How to test and preview successfully:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Open the preview link directly in a new browser tab to test it.</li>
                <li>When the CRM is connected to the real backend database, this limitation disappears completely because forms will load from our API server instead of browser storage!</li>
              </ul>
            </div>
          )}
          <Link href="/admin/forms" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors inline-block shadow">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading Form Preview...</p>
        </div>
      </div>
    );
  }

  const data = form.data as Record<string, any>;
  const showCountryCodeEnabled = data.showCountryCode === "YES" || data.showCountryCode === "Yes";

  // Form Styling configurations
  const bgColor = data.formBackgroundColor
    ? `#${data.formBackgroundColor}`
    : "#f3f4f6";
  const innerBg = data.innerBackgroundColor
    ? `#${data.innerBackgroundColor}`
    : "#ffffff";
  const labelColor = data.formLabelFontColor
    ? `#${data.formLabelFontColor}`
    : "#374151";
  const btnBg = data.submitButtonBackgroundColor
    ? `#${data.submitButtonBackgroundColor}`
    : "#8B2FE8";
  const btnText = data.submitButtonTextColor
    ? `#${data.submitButtonTextColor}`
    : "#ffffff";
  const btnBorder = data.submitButtonBorderColor
    ? `#${data.submitButtonBorderColor}`
    : "transparent";
  const btnRadius = data.borderRadius ? `${data.borderRadius}px` : "8px";
  const btnFontSize = data.submitButtonFontSize
    ? `${data.submitButtonFontSize}px`
    : "18px";

  const fields = (data.fields || {}) as Record<
    string,
    { label: string; required: boolean; show: boolean }
  >;

  const optinFields = (data.optinFields || {}) as Record<
    string,
    { required: boolean; show: boolean }
  >;

  const additionalFields = (data.additionalFields || []) as Array<{
    required: boolean;
    show: boolean;
    options: string[];
  }>;


  const showPaymentMethod =
    data.paystackEnabled ||
    data.flutterwaveEnabled ||
    data.bankTransferEnabled ||
    data.payOnDeliveryEnabled;

  const hasOptin = data.createOptinForm === "Yes";
  const hasUpsells = data.addUpsell === "Yes" && data.upsellItems && data.upsellItems.length > 0;

  const handleFieldChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleOptinChange = (key: string, val: string) => {
    setOptinValues((prev) => ({ ...prev, [key]: val }));
  };

  const safeRedirect = (url: string) => {
    if (!url) return false;
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }
    const embedded = window.top !== window.self;
    if (embedded) {
      // Embedded in an iframe (e.g. WordPress/Elementor): `window.location` would
      // only navigate the iframe, trapping the redirect inside the embedded box.
      // The iframe can't reliably navigate the top window itself cross-origin —
      // that needs "transient activation", which has usually expired by the time
      // the async order submit + delay finishes. So we ask the host page to do it:
      // the embed snippet on the host listens for this message and runs
      // `window.location` in its own (unrestricted) context, navigating the whole
      // tab to the thank-you / sales page.
      try {
        window.parent.postMessage({ type: "nc-redirect", url: targetUrl }, "*");
      } catch {
        /* fall through to the best-effort top navigation below */
      }
    }
    // Standalone preview (not embedded), or a best-effort fallback when the host
    // page lacks the embed script: navigate directly.
    try {
      const topWin = window.top;
      if (topWin && topWin !== window.self) {
        topWin.location.assign(targetUrl);
      } else {
        window.location.assign(targetUrl);
      }
    } catch {
      /* top navigation blocked — rely on the host's nc-redirect handler above */
    }
    return true;
  };

  const submitOptin = (e: React.FormEvent) => {
    e.preventDefault();

    // Explicit Validation Check
    const missingFields: string[] = [];
    Object.entries(optinFields)
      .filter(([, f]) => f.show && f.required)
      .forEach(([key]) => {
        if (!optinValues[key] || !optinValues[key].trim()) {
          missingFields.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
    
    additionalFields
      .filter((f) => f.show && f.required)
      .forEach((f, index) => {
        if (!optinValues[`custom_${index}`] || !optinValues[`custom_${index}`].trim()) {
          missingFields.push(`Custom Option ${index + 1}`);
        }
      });

    if (missingFields.length > 0) {
      showToast(`⚠️ Please fill in all required fields: ${missingFields.join(", ")}`, "info");
      return;
    }

    if (data.salesPageUrl) {
      showToast("✓ Opt-In Details Submitted! Redirecting to Sales Page...", "success");
      setTimeout(() => {
        safeRedirect(data.salesPageUrl);
      }, 1000);
    } else {
      showToast("✓ Opt-In Details Submitted Successfully! Proceeding to Checkout Form.", "success");
      setActiveTab("order");
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Explicit Validation Check
    const missingFields: string[] = [];
    Object.entries(fields)
      .filter(([, f]) => f.show && f.required)
      .forEach(([key, f]) => {
        if (!formValues[key] || !formValues[key].trim()) {
          missingFields.push(f.label || key.charAt(0).toUpperCase() + key.slice(1));
        }
      });

    if (missingFields.length > 0) {
      showToast(`⚠️ Please fill in all required fields: ${missingFields.join(", ")}`, "info");
      return;
    }

    // Resolve the selected package variation
    const variations = (data.priceVariations as PriceVariation[] | undefined) ?? [];
    const selectedVariation =
      variations.find((v) => v.name === selectedPackage) ?? variations[0];

    // productId: prefer variation's productId (new forms), fall back to form's selectedProduct
    const productId: string =
      selectedVariation?.productId ?? (data.selectedProduct as string) ?? "";

    if (!productId) {
      showToast("⚠️ No product is linked to this form. Please contact the seller.", "info");
      return;
    }

    // Build customer phone/whatsapp with country code.
    // Only prepend the country code when an actual number was entered — otherwise
    // an empty field would become a bare prefix like "+234", which the server
    // would mistake for a real, shared identifier and collapse every order onto
    // the same customer record.
    const withCountryCode = (raw: string, code: string) => {
      const num = (raw ?? "").replace(/\s+/g, "").replace(/^0/, "");
      if (!num) return "";
      return showCountryCodeEnabled ? `${code}${num}`.replace(/\s+/g, "") : num;
    };

    const phone = withCountryCode(formValues.phone ?? "", phoneCountryCode);
    const whatsapp = withCountryCode(formValues.whatsapp ?? "", whatsappCountryCode);

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          customerName: formValues.name ?? "",
          customerPhone: phone,
          customerWhatsapp: whatsapp || undefined,
          customerEmail: formValues.email ?? "",
          deliveryAddress: formValues.address ?? "",
          state: formValues.state ?? "",
          lga: "",
          productId,
          packageName: selectedVariation?.name ?? "",
          packagePrice: selectedVariation?.price ?? 0,
          packageQty: selectedVariation?.quantity ?? 1,
          // Order bump (if checked and configured)
          ...(orderBumpChecked && data.orderBumpProduct
            ? {
                orderBumpProductId: data.orderBumpProduct as string,
                orderBumpPrice: 0,
                orderBumpQty: 1,
              }
            : {}),
        }),
      });

      const result = await res.json();

      if (result.error) {
        showToast(`❌ ${result.error}`, "info");
        return;
      }

      setOrderNumber(result.orderNumber ?? "");
      showToast(`✓ Order ${result.orderNumber} placed! Thank you.`, "success");

      // Advance the funnel
      if (data.thankYouUrl) {
        setTimeout(() => safeRedirect(data.thankYouUrl), 1200);
      } else if (hasUpsells) {
        setActiveTab("upsell");
        setActiveUpsellIndex(0);
      } else {
        setFunnelStep("success");
      }
    } catch {
      showToast("❌ Failed to place order. Please check your connection and try again.", "info");
    } finally {
      setSubmitting(false);
    }
  };


  const acceptUpsell = (product: string) => {
    showToast(`✓ Added ${product} to your order!`, "success");
    advanceUpsell();
  };

  const declineUpsell = () => {
    showToast("✓ Upsell offer skipped.", "info");
    advanceUpsell();
  };

  const advanceUpsell = () => {
    const nextIdx = activeUpsellIndex + 1;
    if (data.upsellItems && nextIdx < data.upsellItems.length) {
      setActiveUpsellIndex(nextIdx);
      const nextVariations = (data.upsellItems[nextIdx]?.priceVariations as PriceVariation[] | undefined) ?? [];
      if (nextVariations.length > 0) setSelectedUpsellPackage(nextVariations[0].name);
    } else {
      if (data.thankYouUrl) {
        showToast("✓ Funnel Completed! Redirecting to Thank You URL...", "success");
        setTimeout(() => {
          safeRedirect(data.thankYouUrl);
        }, 1000);
      } else {
        showToast("✓ Order Fully Completed!", "success");
        setFunnelStep("success");
      }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label} to clipboard!`, "success");
  };

  const renderProductPackages = () => {
    const packages = (data.priceVariations as PriceVariation[] | undefined) ?? [];
    const headingText = data.typeProductText || "Choose Your Preferred Packages";
    const displayStyle = data.productQuantityDisplay || "Radio Button Option";

    if (packages.length === 0) return null;
    const isRadio = displayStyle.toLowerCase().includes("radio");

    if (isRadio) {
      return (
        <div className="mb-6 text-left animate-fadeIn">
          <label className="block text-base font-bold mb-3" style={{ color: labelColor }}>
            {headingText} <span className="text-red-500">*</span>
          </label>
          <div className="w-full border-b-2 border-slate-900 pb-2 flex justify-between text-xs font-black text-slate-700 uppercase tracking-wider">
            <span>Product</span>
            <span>Price</span>
          </div>
          <div className="divide-y divide-gray-200">
            {packages.map((pkg) => {
              const active = selectedPackage === pkg.name;
              return (
                <div
                  key={pkg.name}
                  onClick={() => setSelectedPackage(pkg.name)}
                  className={`flex items-center justify-between py-3.5 cursor-pointer group transition-all ${
                    active ? "bg-purple-50/20" : "hover:bg-gray-50/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        active
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-300 group-hover:border-gray-400 bg-white"
                      }`}
                    >
                      {active && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-scaleIn" />
                      )}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${active ? "text-purple-900 font-extrabold" : "text-gray-800"}`}>
                      {pkg.name}
                    </span>
                  </div>
                  <span className={`text-sm font-extrabold transition-colors ${active ? "text-purple-900" : "text-gray-800"}`}>
                    {pkg.formattedPrice}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Dropdown style
      return (
        <div className="mb-6 text-left animate-fadeIn">
          <label className="block text-sm font-semibold mb-1" style={{ color: labelColor }}>
            {headingText} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer pr-10 font-bold"
            >
              {packages.map((pkg) => (
                <option key={pkg.name} value={pkg.name} className="font-semibold text-gray-800">
                  {pkg.name} ({pkg.formattedPrice})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      );
    }
  };

  const renderUpsellProductPackages = (item: any) => {
    const packages = (item.priceVariations as PriceVariation[] | undefined) ?? [];
    const headingText = data.typeProductText || "Choose Your Preferred Packages";
    const displayStyle = data.productQuantityDisplay || "Radio Button Option";

    if (packages.length === 0) return null;
    const isRadio = displayStyle.toLowerCase().includes("radio");

    if (isRadio) {
      return (
        <div className="mb-6 text-left animate-fadeIn max-w-md mx-auto">
          <label className="block text-base font-bold mb-3" style={{ color: labelColor }}>
            {headingText} <span className="text-red-500">*</span>
          </label>
          <div className="w-full border-b-2 border-slate-900 pb-2 flex justify-between text-xs font-black text-slate-700 uppercase tracking-wider">
            <span>Product</span>
            <span>Price</span>
          </div>
          <div className="divide-y divide-gray-200 bg-white rounded-xl px-4 border border-gray-100 shadow-sm">
            {packages.map((pkg) => {
              const active = selectedUpsellPackage === pkg.name;
              return (
                <div
                  key={pkg.name}
                  onClick={() => setSelectedUpsellPackage(pkg.name)}
                  className={`flex items-center justify-between py-3.5 cursor-pointer group transition-all ${
                    active ? "bg-purple-50/20" : "hover:bg-gray-50/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        active
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-300 group-hover:border-gray-400 bg-white"
                      }`}
                    >
                      {active && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-scaleIn" />
                      )}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${active ? "text-purple-900 font-extrabold" : "text-gray-800"}`}>
                      {pkg.name}
                    </span>
                  </div>
                  <span className={`text-sm font-extrabold transition-colors ${active ? "text-purple-900" : "text-gray-800"}`}>
                    {pkg.formattedPrice}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Dropdown style
      return (
        <div className="mb-6 text-left animate-fadeIn max-w-md mx-auto">
          <label className="block text-sm font-semibold mb-1" style={{ color: labelColor }}>
            {headingText} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedUpsellPackage}
              onChange={(e) => setSelectedUpsellPackage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer pr-10 font-bold"
            >
              {packages.map((pkg) => (
                <option key={pkg.name} value={pkg.name} className="font-semibold text-gray-800">
                  {pkg.name} ({pkg.formattedPrice})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      );
    }
  };

  // ── Full-page success takeover (early return — all hooks are already above) ──
  if (funnelStep === "success") {
    const customerName = formValues.name || optinValues.name || "";
    const customerPhone = formValues.phone
      ? `${showCountryCodeEnabled ? phoneCountryCode + " " : ""}${formValues.phone}`
      : optinValues.whatsapp
      ? `${showCountryCodeEnabled ? optinWhatsappCountryCode + " " : ""}${optinValues.whatsapp}`
      : "";

    return (
      <div
        id="nc-order-form-root"
        className="w-full min-h-screen flex flex-col items-center justify-center py-12 px-4"
        style={{ background: bgColor }}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          style={{ background: innerBg }}
        >
          {/* Green top bar */}
          <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

          <div className="p-8 text-center space-y-6">
            {/* Check icon */}
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm border-4 border-emerald-100">
              <Check size={38} className="stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Order Confirmed!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Thank you{customerName ? `, ${customerName}` : ""}. Your order has been received and is being processed.
              </p>
            </div>

            {/* Receipt */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden text-left text-xs text-gray-600">
              {orderNumber && (
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                  <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wide">Order Reference</span>
                  <span className="font-mono font-black text-emerald-900 text-sm">{orderNumber}</span>
                </div>
              )}
              <div className="divide-y divide-gray-100 px-4">
                {customerName && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">Name</span>
                    <span className="font-semibold text-gray-800">{customerName}</span>
                  </div>
                )}
                {customerPhone && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-semibold text-gray-800 font-mono">{customerPhone}</span>
                  </div>
                )}
                {formValues.whatsapp && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">WhatsApp</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {showCountryCodeEnabled ? whatsappCountryCode + " " : ""}{formValues.whatsapp}
                    </span>
                  </div>
                )}
                {formValues.state && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">State</span>
                    <span className="font-semibold text-gray-800">{formValues.state}</span>
                  </div>
                )}
                {selectedPackage && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">Package</span>
                    <span className="font-semibold text-purple-700">{selectedPackage}</span>
                  </div>
                )}
                {selectedPayment && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-semibold text-gray-800 capitalize">{selectedPayment.replace(/_/g, " ")}</span>
                  </div>
                )}
                {orderBumpChecked && data.orderBumpProduct && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">Add-on</span>
                    <span className="font-semibold text-indigo-700">{data.orderBumpProduct}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Our team will reach out to you shortly to confirm delivery details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="nc-order-form-root"
      className="w-full flex flex-col items-center py-6 px-4 relative transition-colors duration-300"
      style={{ background: bgColor }}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border border-slate-800 animate-bounce">
          {toast.type === "success" ? (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-xs">✓</span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-xs">i</span>
          )}
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-2xl">
        {/* Banner with step selector if Optin or Upsell are present */}
        {!isIframe && (hasOptin || hasUpsells) && (
          <div className="bg-slate-900 text-white border-b border-slate-800 overflow-hidden w-full">
            <div className="flex bg-slate-950 p-1.5 gap-1">
              {hasOptin && (
                <button
                  onClick={() => { setActiveTab("optin"); setFunnelStep("active"); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "optin" && funnelStep === "active"
                      ? "bg-purple-600 text-white shadow-md scale-100"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Sparkles size={14} /> 1. Opt-In Form
                </button>
              )}
              <button
                onClick={() => { setActiveTab("order"); setFunnelStep("active"); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "order" && funnelStep === "active"
                    ? "bg-purple-600 text-white shadow-md scale-100"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <CreditCard size={14} /> {hasOptin ? "2." : "1."} Checkout Form
              </button>
              {hasUpsells && (
                <button
                  onClick={() => { setActiveTab("upsell"); setFunnelStep("active"); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "upsell" && funnelStep === "active"
                      ? "bg-purple-600 text-white shadow-md scale-100"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <ShoppingBag size={14} /> {hasOptin ? "3." : "2."} Upsell Offer ({data.upsellItems.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Funnel Form Content */}
        <div
          className="overflow-hidden w-full"
          style={{ background: innerBg }}
        >
          {activeTab === "optin" ? (
            /* ── OPT-IN FORM PREVIEW ── */
            <form onSubmit={submitOptin} className="px-8 py-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1
                  className="text-2xl font-black leading-snug"
                  style={{ color: labelColor, fontFamily: data.formFontType !== "System Default" ? data.formFontType : undefined }}
                >
                  {data.formHeaderText || "Unlock Your Premium Offer Today"}
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                  {data.formSubHeaderText || "Enter details below to claim massive discounts"}
                </p>
              </div>

              {/* Opt-in Fields */}
              <div className="space-y-1">
                {Object.entries(optinFields)
                  .filter(([, f]) => f.show)
                  .map(([key, f]) => {
                    const isPhoneField = key === "whatsapp" || key === "phone";
                    const showCC = isPhoneField && showCountryCodeEnabled;
                    return (
                      <FormField
                        key={key}
                        label={key === "whatsapp" ? "Your WhatsApp Number" : key.charAt(0).toUpperCase() + key.slice(1)}
                        placeholder={`Enter your ${key === "whatsapp" ? "WhatsApp Number" : key}`}
                        required={f.required}
                        type={key === "email" ? "email" : "text"}
                        value={optinValues[key] || ""}
                        onChange={(v) => handleOptinChange(key, v)}
                        labelColor={labelColor}
                        showCountryCode={showCC}
                        countryCodeValue={optinWhatsappCountryCode}
                        onCountryCodeChange={setOptinWhatsappCountryCode}
                      />
                    );
                  })}

                {/* Additional fields */}
                {additionalFields
                  .filter((f) => f.show)
                  .map((f, index) => {
                    const label = `Custom Option ${index + 1}`;
                    return (
                      <div key={index} className="mb-4 text-left">
                        <label className="block text-sm font-semibold mb-1" style={{ color: labelColor }}>
                          {label}
                          {f.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                          value={optinValues[`custom_${index}`] || ""}
                          onChange={(e) => handleOptinChange(`custom_${index}`, e.target.value)}
                          required={f.required}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select Option</option>
                          {f.options.filter(Boolean).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>

              {/* Opt-in Submit */}
              <div>
                <button
                  type="submit"
                  className="w-full font-black uppercase text-center py-4 px-6 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  style={{
                    background: btnBg,
                    color: btnText,
                    border: `2px solid ${btnBorder}`,
                    borderRadius: btnRadius,
                    fontSize: btnFontSize,
                  }}
                >
                  {data.optinButtonText || "TAKE ME IN NOW!"} <ArrowRight size={18} />
                </button>
              </div>
            </form>
          ) : activeTab === "order" ? (
            /* ── MAIN ORDER FORM PREVIEW ── */
            <form onSubmit={submitOrder}>
              {/* Header */}
              {(data.formHeaderText || data.formSubHeaderText) && (
                <div className="px-8 pt-8 pb-2 text-center space-y-1">
                  {data.formHeaderText && (
                    <h1
                      className="text-2xl font-black leading-snug"
                      style={{ color: labelColor, fontFamily: data.formFontType !== "System Default" ? data.formFontType : undefined }}
                    >
                      {data.formHeaderText}
                    </h1>
                  )}
                  {data.formSubHeaderText && (
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{data.formSubHeaderText}</p>
                  )}
                </div>
              )}

              <div className="px-8 py-6 space-y-5">
                {/* Product Packages on Top */}
                {data.showProductQuantityOnTop === "Yes" && renderProductPackages()}

                {/* Form fields */}
                <div className="space-y-1">
                  {Object.entries(fields)
                    .filter(([, f]) => f.show)
                    .sort(([a], [b]) => fieldOrderIndex(a) - fieldOrderIndex(b))
                    .map(([key, f]) => {
                      if (key === "state") {
                        return (
                          <div key={key} className="mb-4 text-left">
                            <label className="block text-sm font-semibold mb-1" style={{ color: labelColor }}>
                              {f.label || "State"}
                              {f.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <select
                              value={formValues[key] || ""}
                              onChange={(e) => handleFieldChange(key, e.target.value)}
                              required={f.required}
                              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="">Select State</option>
                              {NIGERIAN_STATES.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      const isPhoneField = key === "phone" || key === "whatsapp";
                      const showCC = isPhoneField && showCountryCodeEnabled;
                      const ccVal = key === "phone" ? phoneCountryCode : whatsappCountryCode;
                      const ccChange = key === "phone" ? setPhoneCountryCode : setWhatsappCountryCode;
                      return (
                        <FormField
                          key={key}
                          label={f.label || (key === "phone" ? "Your Phone Number" : key === "whatsapp" ? "Your WhatsApp Number" : key.charAt(0).toUpperCase() + key.slice(1))}
                          placeholder={f.label || `Your ${key === "phone" ? "Phone Number" : key === "whatsapp" ? "WhatsApp Number" : key}`}
                          required={f.required}
                          type={key === "email" ? "email" : "text"}
                          value={formValues[key] || ""}
                          onChange={(v) => handleFieldChange(key, v)}
                          labelColor={labelColor}
                          showCountryCode={showCC}
                          countryCodeValue={ccVal}
                          onCountryCodeChange={ccChange}
                        />
                      );
                    })}
                </div>

                {/* Interactive Payment Methods Selection */}
                {showPaymentMethod && (
                  <div className="text-left space-y-2">
                    <p className="text-xs font-black text-gray-700 uppercase tracking-widest">
                      {data.selectMethodText || "SELECT A PAYMENT METHOD"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.paystackEnabled && (
                        <div
                          onClick={() => setSelectedPayment("paystack")}
                          className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedPayment === "paystack"
                              ? "border-purple-600 bg-purple-50/50 shadow-md font-bold scale-[1.01]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedPayment === "paystack"}
                            onChange={() => setSelectedPayment("paystack")}
                            className="accent-purple-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Paystack</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Online Card/Bank</p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0ba4db] flex-shrink-0 animate-pulse" />
                        </div>
                      )}
                      
                      {data.flutterwaveEnabled && (
                        <div
                          onClick={() => setSelectedPayment("flutterwave")}
                          className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedPayment === "flutterwave"
                              ? "border-purple-600 bg-purple-50/50 shadow-md font-bold scale-[1.01]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedPayment === "flutterwave"}
                            onChange={() => setSelectedPayment("flutterwave")}
                            className="accent-purple-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Flutterwave</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Online Payment</p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623] flex-shrink-0 animate-pulse" />
                        </div>
                      )}

                      {data.bankTransferEnabled && (
                        <div
                          onClick={() => setSelectedPayment("bank_transfer")}
                          className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedPayment === "bank_transfer"
                              ? "border-purple-600 bg-purple-50/50 shadow-md font-bold scale-[1.01]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedPayment === "bank_transfer"}
                            onChange={() => setSelectedPayment("bank_transfer")}
                            className="accent-purple-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Bank Transfer</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Manual Transfer</p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1a3c8e] flex-shrink-0" />
                        </div>
                      )}

                      {data.payOnDeliveryEnabled && (
                        <div
                          onClick={() => setSelectedPayment("pay_on_delivery")}
                          className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedPayment === "pay_on_delivery"
                              ? "border-purple-600 bg-purple-50/50 shadow-md font-bold scale-[1.01]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedPayment === "pay_on_delivery"}
                            onChange={() => setSelectedPayment("pay_on_delivery")}
                            className="accent-purple-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Pay On Delivery</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Cash on delivery</p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0d7a6e] flex-shrink-0" />
                        </div>
                      )}
                    </div>

                    {/* Online discount message if configured */}
                    {data.discountMessageOnline && (selectedPayment === "paystack" || selectedPayment === "flutterwave") && (
                      <p className="text-xs text-green-700 font-bold bg-green-50 p-2 rounded-lg border border-green-100 mt-2">
                        🏷 {data.discountMessageOnline}
                      </p>
                    )}

                    {/* DYNAMIC BANK DETAILS DRAWER - WHAT USER REPORTED WAS MISSING */}
                    {data.bankTransferEnabled && selectedPayment === "bank_transfer" && (
                      <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3 shadow-inner text-left animate-fadeIn">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 bg-blue-600 text-white rounded-lg"><CreditCard size={14} /></span>
                          <p className="font-black text-xs text-blue-900 uppercase tracking-widest">
                            🏦 Direct Bank Account Transfer
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-3.5 rounded-lg border border-blue-100">
                          {data.bankName && (
                            <div className="space-y-0.5">
                              <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wide">Bank Name</span>
                              <p className="font-bold text-gray-800 text-sm">{data.bankName}</p>
                            </div>
                          )}
                          {data.bankAccountNumber && (
                            <div className="space-y-0.5">
                              <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wide">Account Number</span>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-gray-800 text-sm font-mono tracking-wider">{data.bankAccountNumber}</p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(data.bankAccountNumber, "Account Number")}
                                  className="p-1 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 active:scale-95 rounded-md transition-all flex items-center justify-center shadow-sm"
                                  title="Copy Account Number"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                          {data.bankAccountName && (
                            <div className="sm:col-span-2 space-y-0.5 border-t border-gray-100 pt-2 mt-1">
                              <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wide">Account Name</span>
                              <p className="font-bold text-gray-800">{data.bankAccountName}</p>
                            </div>
                          )}
                        </div>
                        
                        {data.bankAfterPaymentInstruction && (
                          <div className="p-2.5 bg-blue-100/40 border-l-4 border-blue-500 rounded-r-md text-xs text-gray-700">
                            <span className="font-bold text-blue-900">What to do after payment:</span>{" "}
                            {data.bankAfterPaymentInstruction}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Text before button */}
                {/* Product Packages on Bottom */}
                {data.showProductQuantityOnTop !== "Yes" && renderProductPackages()}

                {data.textBeforeSubmitButton && data.textBeforeSubmitButton !== "Add here" && (
                  <p className="text-center text-xs text-gray-500 mt-2 italic">
                    {data.textBeforeSubmitButton}
                  </p>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-black uppercase transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
                    style={{
                      background: btnBg,
                      color: btnText,
                      border: `2px solid ${btnBorder}`,
                      borderRadius: btnRadius,
                      fontSize: btnFontSize,
                      padding: "14px 24px",
                    }}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      <><ShoppingBag size={18} /> {data.submitButtonText || "ORDER NOW"}</>
                    )}
                  </button>
                </div>

                {/* Terms */}
                {data.termsAndConditions && (
                  <div className="flex items-start gap-2.5 pb-2 text-left bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <input type="checkbox" required className="mt-1 accent-purple-600 w-4 h-4 cursor-pointer" />
                    <p className="text-xs text-gray-500 leading-relaxed">{data.termsAndConditions}</p>
                  </div>
                )}
              </div>

              {/* HIGH CONVERTING INTERACTIVE ORDER BUMP BOX */}
              {data.addOrderBump === "Yes" && (
                <div
                  className="mx-8 mb-8 rounded-xl p-5 border-2 border-dashed relative overflow-hidden transition-all duration-300 hover:shadow-md"
                  style={{
                    background: data.orderBumpBgColor
                      ? `#${data.orderBumpBgColor}`
                      : "#FFFF99",
                    borderColor: data.orderBumpProductTextColor
                      ? `#${data.orderBumpProductTextColor}`
                      : "#0000B2",
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-4 items-start text-left">
                    {data.orderBumpImageUrl && (
                      <img
                        src={data.orderBumpImageUrl}
                        alt="Order Bump Product"
                        className="w-20 h-20 object-cover rounded-xl border border-gray-300/50 shadow-sm flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-widest uppercase bg-red-600 text-white px-2 py-0.5 rounded-full inline-block animate-pulse">
                          🔥 {data.orderBumpPreText || "Special Offer"}
                        </span>
                      </div>
                      
                      <h4
                        className="text-base font-black leading-tight"
                        style={{
                          color: data.orderBumpProductTextColor
                            ? `#${data.orderBumpProductTextColor}`
                            : "#0000B2",
                        }}
                      >
                        {data.orderBumpBiggestBenefit || "Amazing Benefit Here!"}
                      </h4>
                      
                      {data.orderBumpProduct && (
                        <p className="text-xs font-bold text-gray-800">
                          📦 Product Offer: {data.orderBumpProduct}
                        </p>
                      )}
                      
                      <p className="text-sm font-semibold text-gray-700">
                        {data.orderBumpHeader || "Would You Like To Add This?"}
                      </p>
                      
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {data.orderBumpCallToAction}
                      </p>

                      {data.orderBumpScarcityText && (
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
                          ⚠️ {data.orderBumpScarcityText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pulsating checkbox card */}
                  <div className="mt-4 flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg border border-gray-200 cursor-pointer shadow-sm" onClick={() => setOrderBumpChecked(!orderBumpChecked)}>
                    <input
                      type="checkbox"
                      checked={orderBumpChecked}
                      onChange={(e) => setOrderBumpChecked(e.target.checked)}
                      className="w-5 h-5 cursor-pointer accent-purple-600 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs sm:text-sm font-black text-gray-800 cursor-pointer select-none">
                      {data.orderBumpCtaCheckbox || "Yes, I will Take It"}
                    </span>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* ── UPSELL OFFER PREVIEW ── */
            <div>
              {data.upsellItems && data.upsellItems[activeUpsellIndex] ? (
                (() => {
                  const item = data.upsellItems[activeUpsellIndex];
                  return (
                    <div className="px-8 py-8 space-y-6 text-center animate-fadeIn">
                      {/* Urgency Red Alert Box (Only if scarcity text is actually filled by user) */}
                      {item.scarcityText && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center max-w-md mx-auto shadow-sm animate-pulse">
                          <p
                            className="font-bold text-red-700"
                            style={{ fontSize: item.scarcityTextSize ? `${item.scarcityTextSize}px` : "16px" }}
                          >
                            ⚠️ {item.scarcityText}
                          </p>
                        </div>
                      )}

                      {/* Clean Product Name Heading */}
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center max-w-md mx-auto">
                        {item.product || "Upsell Product"}
                      </h2>

                      {/* Upsell Product Packages / Options Selection */}
                      {renderUpsellProductPackages(item)}

                      {/* Upsell CTA buttons */}
                      <div className="space-y-4 max-w-md mx-auto pt-4">
                        <button
                          onClick={() => acceptUpsell(item.product)}
                          className="w-full font-black uppercase py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                          <Check size={18} /> {item.buttonText || "YES, ADD TO MY ORDER!"}
                        </button>
                        
                        <button
                          onClick={declineUpsell}
                          className="text-gray-400 font-bold hover:text-red-500 transition-colors underline block mx-auto py-1"
                          style={{ fontSize: item.declineTextSize ? `${item.declineTextSize}px` : "16px" }}
                        >
                          {item.declineText || "No, I don't want this special discount"}
                        </button>
                      </div>

                      {/* Progress dots for multiple upsells */}
                      {data.upsellItems.length > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                          {data.upsellItems.map((_: any, i: number) => (
                            <span
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                                i === activeUpsellIndex ? "bg-purple-600 w-6" : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-semibold text-sm">No Upsell Offers Configured.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
