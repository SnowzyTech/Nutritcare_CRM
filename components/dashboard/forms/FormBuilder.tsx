"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronDown, X } from "lucide-react";
import { createFormAction, updateFormAction } from "@/modules/admin/actions/forms.action";

export type ProductPackage = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export type ProductWithOffers = {
  id: string;
  name: string;
  sellingPrice: number;
  packages: ProductPackage[];
};

export type PriceVariation = {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  productId: string;  // which product this variation belongs to
  quantity: number;   // package quantity (units in this package)
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function computeVariations(product: ProductWithOffers, usePriceVariation: string): PriceVariation[] {
  if (usePriceVariation === "Yes" && product.packages.length > 0) {
    return product.packages.map((pkg) => ({
      id: pkg.id,
      productId: product.id,
      quantity: pkg.quantity > 0 ? pkg.quantity : 1,
      name: pkg.quantity > 0 ? `${pkg.name} (${pkg.quantity} units)` : pkg.name,
      price: Number(pkg.price),
      formattedPrice: formatNaira(Number(pkg.price)),
    }));
  }
  return [
    {
      id: product.id,
      productId: product.id,
      quantity: 1,
      name: product.name,
      price: Number(product.sellingPrice),
      formattedPrice: formatNaira(Number(product.sellingPrice)),
    },
  ];
}

/* ── Nigerian States List ── */
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

/* ── Custom Toggle Component ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

/* ─ Custom Color Picker Component ── */
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 text-sm text-gray-500 outline-none"
      />
      <div className="w-8 h-8 flex items-center justify-center border-l border-gray-200">
        <input
          type="color"
          value={value.startsWith("#") ? value : `#${value}`}
          onChange={(e) => onChange(e.target.value.replace("#", ""))}
          className="w-6 h-6 cursor-pointer border-0 p-0"
        />
      </div>
    </div>
  );
}

/* ─ Custom Select Component ── */
type SelectOption = string | { label: string; value: string };
function CustomSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: SelectOption[]; placeholder: string }) {
  const normalized = (options as SelectOption[]).map((o) =>
    typeof o === "string" ? { label: o, value: o } : o
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-400 outline-none focus:border-purple-300 appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
    >
      <option value="">{placeholder}</option>
      {normalized.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

/* ─ Main FormBuilder Component ── */
export function FormBuilder({
  editId,
  initialData,
  products = [],
}: {
  editId?: string;
  initialData?: Record<string, unknown>;
  products?: ProductWithOffers[];
} = {}) {
  const productOptions = products.map((p) => ({ label: p.name, value: p.id }));
  const defaultFormData = {
    formName: "",
    hasWebsite: false,
    formHeaderText: "",
    formSubHeaderText: "",
    selectedProduct: "",        // stores product ID
    selectedProductName: "",    // stores product display name
    usePriceVariation: "",
    priceVariations: [] as PriceVariation[],

    fields: {
      name: { label: "", required: false, show: false },
      phone: { label: "", required: false, show: false },
      whatsapp: { label: "", required: true, show: false },
      email: { label: "", required: true, show: true },
      address: { label: "", required: false, show: false },
      state: { label: "", required: true, show: true },
    },

    showCountryCode: "YES",
    productQuantityDisplay: "Radio Button Option",
    typeProductText: "Choose Your Preferred Packages",
    formBackgroundColor: "FFFFFF",
    innerBackgroundColor: "FFFFFF",
    showProductQuantityOnTop: "Yes",
    showFormFieldsLabel: "Yes",
    allowTypeVariationQuantity: "Yes",
    formLabelColor: "111827",

    createOptinForm: "Yes",
    optinFields: {
      name: { required: false, show: true },
      email: { required: false, show: true },
      whatsapp: { required: true, show: false },
    },
    additionalFields: [
      { required: true, show: true, options: ["", ""] },
      { required: true, show: true, options: ["", ""] },
      { required: true, show: true, options: ["", ""] },
    ],

    optinButtonText: "TAKE ME IN NOW!",
    salesPageUrl: "",
    submitButtonBackgroundColor: "B57900",
    submitButtonTextColor: "4E0274",
    submitButtonBorderColor: "40FF00",
    borderRadius: "12",
    submitButtonFontSize: "22",
    formWidth: "Normal",
    formFieldsHeight: "50",
    formLabelFontSize: "18",
    formFontType: "System Default",
    formLabelFontColor: "111827",
    submitButtonText: "ORDER NOW",
    textBeforeSubmitButton: "Add here",

    addOrderBump: "No",
    orderBumpPreText: "",
    orderBumpBiggestBenefit: "",
    orderBumpHeader: "",
    orderBumpCallToAction: "",
    orderBumpScarcityText: "",
    orderBumpCtaCheckbox: "",
    orderBumpBgColor: "FFFF99",
    orderBumpProductTextColor: "0000B2",
    orderBumpProduct: "",       // product ID
    orderBumpProductName: "",   // product display name
    orderBumpPriceVariation: "",
    orderBumpImageUrl: "",
    orderBumpVideoUrl: "",

    addUpsell: "No",
    upsellItems: [
      { productId: "", product: "", priceVariations: [] as PriceVariation[], pageUrl: "", formWidth: "Normal", buttonText: "YES ADD TO MY ORDER", declineText: "No I dont want this huge give-away discount", declineTextSize: "18", scarcityText: "", scarcityTextSize: "18" }
    ] as Array<{ productId: string; product: string; priceVariations: PriceVariation[]; pageUrl: string; formWidth: string; buttonText: string; declineText: string; declineTextSize: string; scarcityText: string; scarcityTextSize: string }>,

    thankYouUrl: "",

    // Payment Methods — individual toggles
    paystackEnabled: false,
    paystackKey: "",
    flutterwaveEnabled: false,
    flutterwaveKey: "",
    bankTransferEnabled: false,
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankAfterPaymentInstruction: "",
    payOnDeliveryEnabled: false,

    // Payment config fields (shown when any online method is enabled)
    selectMethodText: "",
    discountMessageOnline: "",
    discountAmountOnline: "",
    commitmentFee: "",
    selectStatesExclude: [] as string[],

    useCouponDiscount: "",
    enableStatesDeliveryFee: "",
    useCustomStates: "",
    emailForNotifications: "",
    showOrderId: "",
    showMessageBanned: "Yes",
    termsAndConditions: "",
  };

  const [formData, setFormData] = useState<typeof defaultFormData>(() => {
    if (initialData) {
      return { ...defaultFormData, ...initialData } as typeof defaultFormData;
    }
    return defaultFormData;
  });
  const [saving, setSaving] = useState(false);


  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedField = (section: string, key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev[section as keyof typeof prev] as object), [key]: value },
    }));
  };

  const updateFieldProp = (field: string, prop: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: { ...prev.fields[field as keyof typeof prev.fields], [prop]: value },
      },
    }));
  };

  const updateOptinFieldProp = (field: string, prop: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      optinFields: {
        ...prev.optinFields,
        [field]: { ...prev.optinFields[field as keyof typeof prev.optinFields], [prop]: value },
      },
    }));
  };

  const updateAdditionalField = (index: number, prop: string, value: any) => {
    setFormData((prev) => {
      const newFields = [...prev.additionalFields];
      newFields[index] = { ...newFields[index], [prop]: value };
      return { ...prev, additionalFields: newFields };
    });
  };

  const updateAdditionalOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setFormData((prev) => {
      const newFields = [...prev.additionalFields];
      const newOptions = [...newFields[fieldIndex].options];
      newOptions[optionIndex] = value;
      newFields[fieldIndex] = { ...newFields[fieldIndex], options: newOptions };
      return { ...prev, additionalFields: newFields };
    });
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      setFormData((prev) => ({ ...prev, selectedProduct: "", selectedProductName: "", priceVariations: [] }));
      return;
    }
    const variations = computeVariations(product, formData.usePriceVariation);
    setFormData((prev) => ({
      ...prev,
      selectedProduct: productId,
      selectedProductName: product.name,
      priceVariations: variations,
    }));
  };

  const handleVariationToggle = (val: string) => {
    const product = products.find((p) => p.id === formData.selectedProduct);
    setFormData((prev) => ({
      ...prev,
      usePriceVariation: val,
      priceVariations: product ? computeVariations(product, val) : prev.priceVariations,
    }));
  };

  const handleOrderBumpProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData((prev) => ({
      ...prev,
      orderBumpProduct: productId,
      orderBumpProductName: product?.name ?? "",
    }));
  };

  const handleUpsellProductSelect = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const items = [...formData.upsellItems];
    items[idx] = {
      ...items[idx],
      productId,
      product: product?.name ?? "",
      priceVariations: product ? computeVariations(product, "Yes") : [],
    };
    updateField("upsellItems", items);
  };

  const handleReset = () => {
    setFormData({
      formName: "",
      hasWebsite: false,
      formHeaderText: "",
      formSubHeaderText: "",
      selectedProduct: "",
      selectedProductName: "",
      usePriceVariation: "",
      priceVariations: [],
      fields: {
        name: { label: "", required: false, show: false },
        phone: { label: "", required: false, show: false },
        whatsapp: { label: "", required: true, show: false },
        email: { label: "", required: true, show: true },
        address: { label: "", required: false, show: false },
        state: { label: "", required: true, show: true },
      },
      showCountryCode: "YES",
      productQuantityDisplay: "Radio Button Option",
      typeProductText: "Choose Your Preferred Packages",
      formBackgroundColor: "FFFFFF",
      innerBackgroundColor: "FFFFFF",
      showProductQuantityOnTop: "Yes",
      showFormFieldsLabel: "Yes",
      allowTypeVariationQuantity: "Yes",
      formLabelColor: "111827",
      createOptinForm: "Yes",
      optinFields: {
        name: { required: false, show: true },
        email: { required: false, show: true },
        whatsapp: { required: true, show: false },
      },
      additionalFields: [
        { required: true, show: true, options: ["", ""] },
        { required: true, show: true, options: ["", ""] },
        { required: true, show: true, options: ["", ""] },
      ],
      optinButtonText: "TAKE ME IN NOW!",
      salesPageUrl: "",
      submitButtonBackgroundColor: "B57900",
      submitButtonTextColor: "4E0274",
      submitButtonBorderColor: "40FF00",
      borderRadius: "12",
      submitButtonFontSize: "22",
      formWidth: "Normal",
      formFieldsHeight: "50",
      formLabelFontSize: "18",
      formFontType: "System Default",
      formLabelFontColor: "111827",
      submitButtonText: "ORDER NOW",
      textBeforeSubmitButton: "Add here",
      addOrderBump: "No",
      orderBumpPreText: "",
      orderBumpBiggestBenefit: "",
      orderBumpHeader: "",
      orderBumpCallToAction: "",
      orderBumpScarcityText: "",
      orderBumpCtaCheckbox: "",
      orderBumpBgColor: "FFFF99",
      orderBumpProductTextColor: "0000B2",
      orderBumpProduct: "",
      orderBumpProductName: "",
      orderBumpPriceVariation: "",
      orderBumpImageUrl: "",
      orderBumpVideoUrl: "",
      addUpsell: "No",
      upsellItems: [
        { productId: "", product: "", priceVariations: [] as PriceVariation[], pageUrl: "", formWidth: "Normal", buttonText: "YES ADD TO MY ORDER", declineText: "No I dont want this huge give-away discount", declineTextSize: "18", scarcityText: "", scarcityTextSize: "18" }
      ] as Array<{ productId: string; product: string; priceVariations: PriceVariation[]; pageUrl: string; formWidth: string; buttonText: string; declineText: string; declineTextSize: string; scarcityText: string; scarcityTextSize: string }>,
      thankYouUrl: "",
      paystackEnabled: false,
      paystackKey: "",
      flutterwaveEnabled: false,
      flutterwaveKey: "",
      bankTransferEnabled: false,
      bankAccountName: "",
      bankAccountNumber: "",
      bankName: "",
      bankAfterPaymentInstruction: "",
      payOnDeliveryEnabled: false,
      selectMethodText: "",
      discountMessageOnline: "",
      discountAmountOnline: "",
      commitmentFee: "",
      selectStatesExclude: [] as string[],
      useCouponDiscount: "",
      enableStatesDeliveryFee: "",
      useCustomStates: "",
      emailForNotifications: "",
      showOrderId: "",
      showMessageBanned: "Yes",
      termsAndConditions: "",
    });
  };

  const router = useRouter();

  const handleAddForm = async () => {
    setSaving(true);
    try {
      const name = formData.formName?.trim() || "Untitled Form";
      if (editId) {
        const res = await updateFormAction(editId, name, formData as Record<string, unknown>);
        if ("error" in res) { alert(res.error); return; }
      } else {
        const res = await createFormAction(name, formData as Record<string, unknown>);
        if ("error" in res) { alert(res.error); return; }
      }
      router.push("/admin/forms");
    } finally {
      setSaving(false);
    }
  };

  const yesNoOptions = ["Yes", "No"];
  const fontOptions = ["System Default", "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia"];

  // Whether any online payment method is enabled (to show the extra config fields)
  const anyOnlinePaymentEnabled =
    formData.paystackEnabled || formData.flutterwaveEnabled || formData.bankTransferEnabled;

  // Multi-select states dropdown state
  const [statesDropdownOpen, setStatesDropdownOpen] = useState(false);
  const statesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statesDropdownRef.current && !statesDropdownRef.current.contains(e.target as Node)) {
        setStatesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStateSelection = (state: string) => {
    setFormData((prev) => {
      const current = prev.selectStatesExclude as string[];
      return {
        ...prev,
        selectStatesExclude: current.includes(state)
          ? current.filter((s) => s !== state)
          : [...current, state],
      };
    });
  };

  const removeState = (state: string) => {
    setFormData((prev) => ({
      ...prev,
      selectStatesExclude: (prev.selectStatesExclude as string[]).filter((s) => s !== state),
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back Linda</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* Basic Info Card */}
        <div className="bg-white rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-600 mb-1">Form Name*</label>
              <input
                type="text"
                value={formData.formName}
                onChange={(e) => updateField("formName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Do you have a website?</span>
              <Toggle checked={formData.hasWebsite} onChange={(v) => updateField("hasWebsite", v)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-600 mb-1">Select Product*</label>
              <CustomSelect
                value={formData.selectedProduct}
                onChange={handleProductSelect}
                options={productOptions.length > 0 ? productOptions : [{ label: "No active products found", value: "" }]}
                placeholder="Select a Product"
              />
              {formData.selectedProductName && (
                <p className="mt-1 text-xs text-purple-600 font-medium">Selected: {formData.selectedProductName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-600 mb-1">Use Price Variation Template?</label>
              <CustomSelect value={formData.usePriceVariation} onChange={handleVariationToggle} options={["Yes", "No"]} placeholder="Select an Option" />
              {formData.priceVariations.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {formData.priceVariations.map((v) => (
                    <p key={v.id} className="text-[11px] text-gray-500 leading-tight">• {v.name} — {v.formattedPrice}</p>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Header Text</label>
              <input
                type="text"
                value={formData.formHeaderText}
                onChange={(e) => updateField("formHeaderText", e.target.value)}
                placeholder="Place fill the form below to place your order"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Sub Header Text</label>
              <input
                type="text"
                value={formData.formSubHeaderText}
                onChange={(e) => updateField("formSubHeaderText", e.target.value)}
                placeholder="Only Serious Buyers Should Fill The Form Below"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
              />
            </div>
          </div>
        </div>

        {/* Form Fields Card */}
        <div className="bg-white rounded-lg p-6">
          <div className="grid grid-cols-12 gap-4 items-center mb-4">
            <div className="col-span-5">
              <h3 className="text-sm font-bold text-gray-700">Form Fields</h3>
            </div>
            <div className="col-span-3">
              <h3 className="text-sm font-bold text-gray-700">Required?</h3>
            </div>
            <div className="col-span-3">
              <h3 className="text-sm font-bold text-gray-700">Show On Form?</h3>
            </div>
            <div className="col-span-1"></div>
          </div>

          {Object.entries(formData.fields).map(([key, field]) => (
            <div key={key} className="grid grid-cols-12 gap-4 items-center mb-3">
              <div className="col-span-5">
                <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">{key} Label</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateFieldProp(key, "label", e.target.value)}
                  placeholder={`Your ${key}`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                />
              </div>
              <div className="col-span-3 flex items-center h-10">
                <Toggle checked={field.required} onChange={(v) => updateFieldProp(key, "required", v)} />
              </div>
              <div className="col-span-3 flex items-center h-10">
                <Toggle checked={field.show} onChange={(v) => updateFieldProp(key, "show", v)} />
              </div>
              {key === "phone" && (
                <div className="col-span-1 flex items-center h-10">
                  <span className="text-xs text-gray-500">Show Country Code</span>
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-gray-100 max-w-xs">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Show Country Code</label>
            <div className="relative flex items-center border border-gray-200 rounded-md overflow-hidden bg-white h-10 w-full sm:w-[250px]">
              <select
                value={formData.showCountryCode}
                onChange={(e) => updateField("showCountryCode", e.target.value)}
                className="w-full h-full pl-3 pr-10 text-sm font-semibold text-gray-700 bg-transparent outline-none appearance-none z-10 cursor-pointer animate-fadeIn"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-purple-50 pointer-events-none border-l border-gray-100">
                <ChevronDown size={14} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings Card */}
        <div className="bg-white rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Product Quantity Display As?</label>
              <CustomSelect value={formData.productQuantityDisplay} onChange={(v) => updateField("productQuantityDisplay", v)} options={["Radio Button Option", "Dropdown Option"]} placeholder="Select an Option" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type Product Text</label>
              <input
                type="text"
                value={formData.typeProductText}
                onChange={(e) => updateField("typeProductText", e.target.value)}
                placeholder="e.g. Choose Your Preferred Packages"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-purple-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Bakground Colour</label>
              <ColorPicker value={formData.formBackgroundColor} onChange={(v) => updateField("formBackgroundColor", v)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Inner Background Color</label>
              <ColorPicker value={formData.innerBackgroundColor} onChange={(v) => updateField("innerBackgroundColor", v)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Show Product Quantity Options On Top of Form?</label>
              <CustomSelect value={formData.showProductQuantityOnTop} onChange={(v) => updateField("showProductQuantityOnTop", v)} options={yesNoOptions} placeholder="Yes" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Show form Fields Label?</label>
              <CustomSelect value={formData.showFormFieldsLabel} onChange={(v) => updateField("showFormFieldsLabel", v)} options={yesNoOptions} placeholder="Yes" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Allow to to type Variation Quantity</label>
              <CustomSelect value={formData.allowTypeVariationQuantity} onChange={(v) => updateField("allowTypeVariationQuantity", v)} options={yesNoOptions} placeholder="Yes" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Text Color (Labels & Headers)</label>
              <ColorPicker value={formData.formLabelFontColor} onChange={(v) => updateField("formLabelFontColor", v)} />
            </div>
          </div>
        </div>

        {/* Hidden Field */}
        <div className="bg-white rounded-lg p-6">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Hidden Field (Whatever you type here won't appear on your form)</label>
          <input
            type="text"
            placeholder="Type Here"
            className="w-full px-3 py-3 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
          />
        </div>

        {/* Divider */}
        <div className="bg-gray-600 text-white text-center py-2 text-xs font-medium rounded">
          • To add more form fields, first save your form and edit.
        </div>

        {/* Create Optin Form */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Create An Optin Form?</span>
          <CustomSelect value={formData.createOptinForm} onChange={(v) => updateField("createOptinForm", v)} options={yesNoOptions} placeholder="Yes" />
        </div>

        {/* Optin Form Fields */}
        {formData.createOptinForm === "Yes" && (
          <div className="space-y-3">
            {Object.entries(formData.optinFields).map(([key, field]) => (
              <div key={key} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 capitalize">{key}</span>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Required?</span>
                    <Toggle checked={field.required} onChange={(v) => updateOptinFieldProp(key, "required", v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show on Form?</span>
                    <Toggle checked={field.show} onChange={(v) => updateOptinFieldProp(key, "show", v)} />
                  </div>
                </div>
              </div>
            ))}

            {/* Additional Fields */}
            {formData.additionalFields.map((field, index) => (
              <div key={index} className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Additional Field</span>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Required?</span>
                      <Toggle checked={field.required} onChange={(v) => updateAdditionalField(index, "required", v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Show on Form?</span>
                      <Toggle checked={field.show} onChange={(v) => updateAdditionalField(index, "show", v)} />
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  className="w-64 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Options</label>
                  <div className="flex gap-3">
                    {field.options.map((opt, optIndex) => (
                      <input
                        key={optIndex}
                        type="text"
                        value={opt}
                        onChange={(e) => updateAdditionalOption(index, optIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optin Button & URL Settings */}
        {formData.createOptinForm === "Yes" && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">SALES PAGE URL</label>
              <input
                type="text"
                value={formData.salesPageUrl || ""}
                onChange={(e) => updateField("salesPageUrl", e.target.value)}
                placeholder="https://yoursalespage.com"
                className="w-full px-3 py-3 border border-gray-200 rounded-md text-sm text-gray-500 outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Optin Button Text</label>
              <input
                type="text"
                value={formData.optinButtonText}
                onChange={(e) => updateField("optinButtonText", e.target.value)}
                className="w-full px-3 py-4 border border-gray-200 rounded-md text-2xl text-center text-gray-500 font-bold outline-none focus:border-purple-300"
              />
            </div>
          </div>
        )}

        {/* Button Settings */}
        <div className="bg-white rounded-lg p-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Submit Button Background Color</label>
              <ColorPicker value={formData.submitButtonBackgroundColor} onChange={(v) => updateField("submitButtonBackgroundColor", v)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Submit Button Text Color</label>
              <ColorPicker value={formData.submitButtonTextColor} onChange={(v) => updateField("submitButtonTextColor", v)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Submit Button Border Color</label>
              <ColorPicker value={formData.submitButtonBorderColor} onChange={(v) => updateField("submitButtonBorderColor", v)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Border Radius</label>
              <input
                type="text"
                value={formData.borderRadius}
                onChange={(e) => updateField("borderRadius", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-center outline-none focus:border-purple-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Submit Button Font Size</label>
              <input
                type="text"
                value={formData.submitButtonFontSize}
                onChange={(e) => updateField("submitButtonFontSize", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-center outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Width</label>
              <CustomSelect value={formData.formWidth} onChange={(v) => updateField("formWidth", v)} options={["Normal", "Wide", "Narrow"]} placeholder="Normal" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Fields Height</label>
              <input
                type="text"
                value={formData.formFieldsHeight}
                onChange={(e) => updateField("formFieldsHeight", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-center outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Label Font Size</label>
              <input
                type="text"
                value={formData.formLabelFontSize}
                onChange={(e) => updateField("formLabelFontSize", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-center outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Font Type</label>
              <CustomSelect value={formData.formFontType} onChange={(v) => updateField("formFontType", v)} options={fontOptions} placeholder="System Default" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Text Color (Labels & Headers)</label>
              <ColorPicker value={formData.formLabelFontColor} onChange={(v) => updateField("formLabelFontColor", v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Submit Button Text</label>
              <input
                type="text"
                value={formData.submitButtonText}
                onChange={(e) => updateField("submitButtonText", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Text To Show Before Submit Button</label>
              <input
                type="text"
                value={formData.textBeforeSubmitButton}
                onChange={(e) => updateField("textBeforeSubmitButton", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-center outline-none focus:border-purple-300"
              />
            </div>
          </div>
        </div>

        {/* Order Bump */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Do you want to add an Order Bump product?</span>
            <CustomSelect value={formData.addOrderBump} onChange={(v) => updateField("addOrderBump", v)} options={yesNoOptions} placeholder="No" />
          </div>

          {formData.addOrderBump === "Yes" && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Product Pre Text</label>
                <input type="text" value={formData.orderBumpPreText} onChange={(e) => updateField("orderBumpPreText", e.target.value)} placeholder="Brand new, Amazing, 100% Genuine etc" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Product Biggest Benefit</label>
                <input type="text" value={formData.orderBumpBiggestBenefit} onChange={(e) => updateField("orderBumpBiggestBenefit", e.target.value)} placeholder="Melts Away Fats In 2 Days!" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Header</label>
                <input type="text" value={formData.orderBumpHeader} onChange={(e) => updateField("orderBumpHeader", e.target.value)} placeholder="Would You Like To Add To Your Order:" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Call To Action</label>
                <input type="text" value={formData.orderBumpCallToAction} onChange={(e) => updateField("orderBumpCallToAction", e.target.value)} placeholder="Kindly click the box below to add this to your order now for just xxxx instead of paying normal price of yyyy!" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Scarcity Text</label>
                <input type="text" value={formData.orderBumpScarcityText} onChange={(e) => updateField("orderBumpScarcityText", e.target.value)} placeholder="This offer is not available at ANY other time or place" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump CTA For Checkbox</label>
                <input type="text" value={formData.orderBumpCtaCheckbox} onChange={(e) => updateField("orderBumpCtaCheckbox", e.target.value)} placeholder="Yes, I will Take It" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
              <div className="flex items-end gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Section Background Color</label>
                  <ColorPicker value={formData.orderBumpBgColor} onChange={(v) => updateField("orderBumpBgColor", v)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Product Text Color</label>
                  <ColorPicker value={formData.orderBumpProductTextColor} onChange={(v) => updateField("orderBumpProductTextColor", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Order Bump Product</label>
                  <CustomSelect
                    value={formData.orderBumpProduct}
                    onChange={handleOrderBumpProductSelect}
                    options={productOptions}
                    placeholder="None"
                  />
                  {formData.orderBumpProductName && (
                    <p className="mt-1 text-[11px] text-purple-600 font-medium">{formData.orderBumpProductName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Offer / Price Variation</label>
                  <CustomSelect
                    value={formData.orderBumpPriceVariation}
                    onChange={(v) => updateField("orderBumpPriceVariation", v)}
                    options={
                      formData.orderBumpProduct
                        ? (products.find((p) => p.id === formData.orderBumpProduct)?.packages.map((pkg) => ({
                            label: pkg.quantity > 0 ? `${pkg.name} (${pkg.quantity} units)` : pkg.name,
                            value: pkg.id,
                          })) ?? [])
                        : []
                    }
                    placeholder="None"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Image (Width: 345px)</label>
                <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-200 file:text-xs file:bg-white file:text-gray-600 hover:file:bg-gray-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Order Bump Video URL &nbsp;<span className="normal-case font-normal text-gray-400">Copy Video URL From YouTube</span></label>
                <input type="text" value={formData.orderBumpVideoUrl} onChange={(e) => updateField("orderBumpVideoUrl", e.target.value)} placeholder="Link from youtube" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
              </div>
            </div>
          )}
        </div>

        {/* Upsell */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Do you want to add an UPSELL product?</span>
            <CustomSelect value={formData.addUpsell} onChange={(v) => updateField("addUpsell", v)} options={yesNoOptions} placeholder="No" />
          </div>

          {formData.addUpsell === "Yes" && (
            <div className="space-y-3 pt-2">
              {formData.upsellItems.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                  {formData.upsellItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = formData.upsellItems.filter((_, i) => i !== idx);
                        updateField("upsellItems", items);
                      }}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete Upsell"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Upsell Product</label>
                      <CustomSelect
                        value={item.productId}
                        onChange={(v) => handleUpsellProductSelect(idx, v)}
                        options={productOptions}
                        placeholder="None"
                      />
                      {item.product && (
                        <p className="mt-1 text-[11px] text-purple-600 font-medium">{item.product}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Page URL &nbsp;<span className="normal-case font-normal text-gray-400">Ensure you add http:// or https:// to your URL</span></label>
                      <input type="text" value={item.pageUrl} onChange={(e) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], pageUrl: e.target.value }; updateField("upsellItems", items); }} placeholder="http://yourupsellpage" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Form Width</label>
                      <CustomSelect value={item.formWidth} onChange={(v) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], formWidth: v }; updateField("upsellItems", items); }} options={["Normal", "Wide", "Narrow"]} placeholder="Normal" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Button Text</label>
                      <input type="text" value={item.buttonText} onChange={(e) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], buttonText: e.target.value }; updateField("upsellItems", items); }} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Decline Offer Text</label>
                      <input type="text" value={item.declineText} onChange={(e) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], declineText: e.target.value }; updateField("upsellItems", items); }} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Decline Offer Text Size</label>
                      <input type="text" value={item.declineTextSize} onChange={(e) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], declineTextSize: e.target.value }; updateField("upsellItems", items); }} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Scarcity Text</label>
                      <input type="text" value={item.scarcityText} onChange={(e) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], scarcityText: e.target.value }; updateField("upsellItems", items); }} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Upsell Scarcity Text Size</label>
                      <input type="text" value={item.scarcityTextSize} onChange={(e) => { const items = [...formData.upsellItems]; items[idx] = { ...items[idx], scarcityTextSize: e.target.value }; updateField("upsellItems", items); }} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => updateField("upsellItems", [...formData.upsellItems, { productId: "", product: "", priceVariations: [], pageUrl: "", formWidth: "Normal", buttonText: "YES ADD TO MY ORDER", declineText: "No I dont want this huge give-away discount", declineTextSize: "18", scarcityText: "", scarcityTextSize: "18" }])}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors"
                >
                  Add More Upsell
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Thank You URL */}
        <div className="bg-white rounded-lg p-6">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Thank You URL Ensure you add http:// or https:// to your URL</label>
          <input
            type="text"
            value={formData.thankYouUrl}
            onChange={(e) => updateField("thankYouUrl", e.target.value)}
            placeholder="Type Here"
            className="w-full px-3 py-3 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
          />
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg p-6">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center mb-6 gap-4">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Method</span>
            <span className="text-xs font-semibold text-gray-500 text-center">API Key</span>
            <span className="text-xs font-semibold text-gray-500 text-center pr-1">Enable?</span>
          </div>

          {/* Paystack Row */}
          <div className="border-t border-gray-100 py-5">
            <div className="grid grid-cols-[200px_1fr_60px] gap-6 items-center">
              {/* Logo placeholder */}
              <div className="flex items-center justify-center border-2 border-blue-400 rounded-lg h-16 bg-white">
                <span className="text-sm font-extrabold text-blue-700 tracking-tight">paystack</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Live Secret Key</label>
                <input
                  type="text"
                  value={formData.paystackKey}
                  onChange={(e) => updateField("paystackKey", e.target.value)}
                  placeholder="Copy & paste Live Secret Key from your PayStack account"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300 bg-gray-50"
                />
              </div>
              <div className="flex justify-center">
                <Toggle checked={formData.paystackEnabled} onChange={(v) => updateField("paystackEnabled", v)} />
              </div>
            </div>
          </div>

          {/* Flutterwave Row */}
          <div className="border-t border-gray-100 py-5">
            <div className="grid grid-cols-[200px_1fr_60px] gap-6 items-center">
              <div className="flex items-center justify-center border-2 border-green-500 rounded-lg h-16 bg-white">
                <span className="text-sm font-extrabold text-green-700 tracking-tight">Flutterwave</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Live Public Key</label>
                <input
                  type="text"
                  value={formData.flutterwaveKey}
                  onChange={(e) => updateField("flutterwaveKey", e.target.value)}
                  placeholder="Copy & paste Live Public Key from your FlutterWave account"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300 bg-gray-50"
                />
              </div>
              <div className="flex justify-center">
                <Toggle checked={formData.flutterwaveEnabled} onChange={(v) => updateField("flutterwaveEnabled", v)} />
              </div>
            </div>
          </div>

          {/* Bank Transfer Row */}
          <div className="border-t border-gray-100 py-5">
            <div className="grid grid-cols-[200px_1fr_60px] gap-6 items-start">
              <div className="flex items-center justify-center border-2 border-blue-700 rounded-lg h-24 bg-white">
                <span className="text-sm font-extrabold text-blue-900 tracking-tight text-center leading-tight px-2">≡ BANK<br />TRANSFER</span>
              </div>
              <div className={`space-y-2 transition-opacity duration-200 ${formData.bankTransferEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Name</label>
                  <input
                    type="text"
                    disabled={!formData.bankTransferEnabled}
                    value={formData.bankAccountName}
                    onChange={(e) => updateField("bankAccountName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300 bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Number</label>
                  <input
                    type="text"
                    disabled={!formData.bankTransferEnabled}
                    value={formData.bankAccountNumber}
                    onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300 bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bank</label>
                  <input
                    type="text"
                    disabled={!formData.bankTransferEnabled}
                    value={formData.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    placeholder="Type Bank Name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300 bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">After Payment Instruction</label>
                  <input
                    type="text"
                    disabled={!formData.bankTransferEnabled}
                    value={formData.bankAfterPaymentInstruction}
                    onChange={(e) => updateField("bankAfterPaymentInstruction", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300 bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <Toggle checked={formData.bankTransferEnabled} onChange={(v) => updateField("bankTransferEnabled", v)} />
              </div>
            </div>
          </div>

          {/* Pay On Delivery Row */}
          <div className="border-t border-gray-100 py-5">
            <div className="grid grid-cols-[200px_1fr_60px] gap-6 items-center">
              <div className="flex items-center justify-center rounded-lg h-16 bg-teal-700 gap-2 px-3">
                <span className="text-white text-sm font-extrabold tracking-tight">Pay On Delivery</span>
              </div>
              <div />
              <div className="flex justify-center">
                <Toggle checked={formData.payOnDeliveryEnabled} onChange={(v) => updateField("payOnDeliveryEnabled", v)} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Config Fields — shown when any online payment method is toggled on */}
        {anyOnlinePaymentEnabled && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Method Text</label>
              <input
                type="text"
                value={formData.selectMethodText}
                onChange={(e) => updateField("selectMethodText", e.target.value)}
                placeholder="SELECT A PAYMENT METHOD"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Discount Message For Paying Online (Leave Blank If None)</label>
              <input
                type="text"
                value={formData.discountMessageOnline}
                onChange={(e) => updateField("discountMessageOnline", e.target.value)}
                placeholder="eg Pay only N12,000 if you pay online OR Get N5,000 discount if you pay online"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Discount Amount For Paying Online</label>
              <input
                type="text"
                value={formData.discountAmountOnline}
                onChange={(e) => updateField("discountAmountOnline", e.target.value)}
                placeholder="eg 5000"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Any Commitment Fee? Type Amount</label>
                <input
                  type="text"
                  value={formData.commitmentFee}
                  onChange={(e) => updateField("commitmentFee", e.target.value)}
                  placeholder="eg 2000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                />
              </div>
              {/* States multi-select dropdown */}
              <div ref={statesDropdownRef} className="relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Select States To <span className="underline">EXCLUDE</span> From Paying Commitment Fee (Leave blank if none)
                </label>
                {/* Trigger box */}
                <div
                  onClick={() => setStatesDropdownOpen((o) => !o)}
                  className="w-full min-h-[38px] px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300 cursor-pointer bg-white flex flex-wrap gap-1 items-center"
                >
                  {(formData.selectStatesExclude as string[]).length === 0 ? (
                    <span className="text-gray-400 text-sm">Click to select states…</span>
                  ) : (
                    (formData.selectStatesExclude as string[]).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeState(s); }}
                          className="hover:text-purple-900"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  )}
                  <ChevronDown size={14} className="ml-auto text-gray-400 flex-shrink-0" />
                </div>
                {/* Dropdown list */}
                {statesDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                    {NIGERIAN_STATES.map((state) => {
                      const selected = (formData.selectStatesExclude as string[]).includes(state);
                      return (
                        <div
                          key={state}
                          onClick={() => toggleStateSelection(state)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 transition-colors ${
                            selected ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selected}
                            className="accent-purple-600 pointer-events-none"
                          />
                          {state}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Settings */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Use Coupon/Discount?</label>
              <CustomSelect value={formData.useCouponDiscount} onChange={(v) => updateField("useCouponDiscount", v)} options={["Select", "Yes", "No"]} placeholder="Select" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Enable States Delivery Fee?</label>
              <CustomSelect value={formData.enableStatesDeliveryFee} onChange={(v) => updateField("enableStatesDeliveryFee", v)} options={["Select", "Yes", "No"]} placeholder="Select" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Use Custom States?</label>
              <CustomSelect value={formData.useCustomStates} onChange={(v) => updateField("useCustomStates", v)} options={["Select", "Yes", "No"]} placeholder="Select" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email To Receive Order Notifications (If you're adding multiple emails, separate each with a comma: email1@email.com, email2@email.com)</label>
            <input
              type="text"
              value={formData.emailForNotifications}
              onChange={(e) => updateField("emailForNotifications", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Show Order ID on Email Notifications</label>
              <CustomSelect value={formData.showOrderId} onChange={(v) => updateField("showOrderId", v)} options={["Select", "Yes", "No"]} placeholder="Select" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Show Message to banned customers?</label>
              <CustomSelect value={formData.showMessageBanned} onChange={(v) => updateField("showMessageBanned", v)} options={yesNoOptions} placeholder="Yes" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Terms & Conditions</label>
            <p className="text-xs text-gray-400 mb-2">This will show a checkbox before the Submit button on your form, for customers to accept your Terms & Conditions before they can submit any order. Leave blank if you don't want the checkbox to appear</p>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) => updateField("termsAndConditions", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={handleAddForm}
            disabled={saving}
            className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-md text-sm transition-colors"
          >
            {saving ? "Saving…" : editId ? "Save Changes" : "Add Form"}
          </button>
          <button
            onClick={handleReset}
            className="px-8 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
