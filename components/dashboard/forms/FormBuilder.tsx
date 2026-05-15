"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";

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
function CustomSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-400 outline-none focus:border-purple-300 appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

/* ─ Main FormBuilder Component ── */
export function FormBuilder() {
  const [formData, setFormData] = useState({
    formName: "",
    hasWebsite: false,
    formHeaderText: "",
    formSubHeaderText: "",
    selectedProduct: "",
    usePriceVariation: "",

    fields: {
      name: { label: "", required: false, show: false },
      phone: { label: "", required: false, show: false },
      whatsapp: { label: "", required: true, show: false },
      email: { label: "", required: true, show: true },
      address: { label: "", required: false, show: false },
      state: { label: "", required: true, show: true },
    },

    showCountryCode: "YES",
    productQuantityDisplay: "",
    typeProductText: "",
    formBackgroundColor: "FFFFFF",
    innerBackgroundColor: "FFFFFF",
    showProductQuantityOnTop: "Yes",
    showFormFieldsLabel: "Yes",
    allowTypeVariationQuantity: "Yes",
    formLabelColor: "FFFFFF",

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
    submitButtonBackgroundColor: "B57900",
    submitButtonTextColor: "4E0274",
    submitButtonBorderColor: "40FF00",
    borderRadius: "12",
    submitButtonFontSize: "22",
    formWidth: "Normal",
    formFieldsHeight: "50",
    formLabelFontSize: "18",
    formFontType: "System Default",
    formLabelFontColor: "40FF00",
    submitButtonText: "ORDER NOW",
    textBeforeSubmitButton: "Add here",

    addOrderBump: "No",
    addUpsell: "No",
    thankYouUrl: "",

    paymentMethodsEnabled: false,
    selectMethodText: "",
    discountMessageOnline: "",
    discountAmountOnline: "",
    discountAmountOnline2: "",
    commitmentFee: "",
    selectStatesExclude: "",

    useCouponDiscount: "",
    enableStatesDeliveryFee: "",
    useCustomStates: "",
    emailForNotifications: "",
    showOrderId: "",
    showMessageBanned: "Yes",
    termsAndConditions: "",
  });

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedField = (section: string, key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [key]: value },
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

  const handleReset = () => {
    setFormData({
      formName: "",
      hasWebsite: false,
      formHeaderText: "",
      formSubHeaderText: "",
      selectedProduct: "",
      usePriceVariation: "",
      fields: {
        name: { label: "", required: false, show: false },
        phone: { label: "", required: false, show: false },
        whatsapp: { label: "", required: true, show: false },
        email: { label: "", required: true, show: true },
        address: { label: "", required: false, show: false },
        state: { label: "", required: true, show: true },
      },
      showCountryCode: "YES",
      productQuantityDisplay: "",
      typeProductText: "",
      formBackgroundColor: "FFFFFF",
      innerBackgroundColor: "FFFFFF",
      showProductQuantityOnTop: "Yes",
      showFormFieldsLabel: "Yes",
      allowTypeVariationQuantity: "Yes",
      formLabelColor: "FFFFFF",
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
      submitButtonBackgroundColor: "B57900",
      submitButtonTextColor: "4E0274",
      submitButtonBorderColor: "40FF00",
      borderRadius: "12",
      submitButtonFontSize: "22",
      formWidth: "Normal",
      formFieldsHeight: "50",
      formLabelFontSize: "18",
      formFontType: "System Default",
      formLabelFontColor: "40FF00",
      submitButtonText: "ORDER NOW",
      textBeforeSubmitButton: "Add here",
      addOrderBump: "No",
      addUpsell: "No",
      thankYouUrl: "",
      paymentMethodsEnabled: false,
      selectMethodText: "",
      discountMessageOnline: "",
      discountAmountOnline: "",
      discountAmountOnline2: "",
      commitmentFee: "",
      selectStatesExclude: "",
      useCouponDiscount: "",
      enableStatesDeliveryFee: "",
      useCustomStates: "",
      emailForNotifications: "",
      showOrderId: "",
      showMessageBanned: "Yes",
      termsAndConditions: "",
    });
  };

  const handleAddForm = () => {
    console.log("Form Data:", formData);
    alert("Form saved! Check console for data.");
  };

  const yesNoOptions = ["Yes", "No"];
  const fontOptions = ["System Default", "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia"];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back Linda</h1>
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <MessageCircle size={20} className="text-purple-600" />
        </div>
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
              <CustomSelect value={formData.selectedProduct} onChange={(v) => updateField("selectedProduct", v)} options={["Product 1", "Product 2", "Product 3"]} placeholder="Select an Option" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-600 mb-1">Use Price Variation Template?</label>
              <CustomSelect value={formData.usePriceVariation} onChange={(v) => updateField("usePriceVariation", v)} options={["Yes", "No"]} placeholder="Select an Option" />
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
                className="w-full h-full pl-3 pr-10 text-sm font-semibold text-gray-300 bg-transparent outline-none appearance-none z-10 cursor-pointer"
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
              <CustomSelect value={formData.productQuantityDisplay} onChange={(v) => updateField("productQuantityDisplay", v)} options={["Dropdown", "Radio Buttons", "Checkboxes"]} placeholder="Select an Option" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type Product Text</label>
              <CustomSelect value={formData.typeProductText} onChange={(v) => updateField("typeProductText", v)} options={["Select your package"]} placeholder="Select your package" />
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Label Color</label>
              <ColorPicker value={formData.formLabelColor} onChange={(v) => updateField("formLabelColor", v)} />
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

        {/* Optin Button Text */}
        <div className="bg-white rounded-lg p-6">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Optin Button Text</label>
          <input
            type="text"
            value={formData.optinButtonText}
            onChange={(e) => updateField("optinButtonText", e.target.value)}
            className="w-full px-3 py-4 border border-gray-200 rounded-md text-2xl text-center text-gray-300 font-bold outline-none focus:border-purple-300"
          />
        </div>

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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Form Label Font Color</label>
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

        {/* Order Bump & Upsell */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Do you want to add an Order Bump product?</span>
            <CustomSelect value={formData.addOrderBump} onChange={(v) => updateField("addOrderBump", v)} options={yesNoOptions} placeholder="No" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Do you want to add an UPSELL product?</span>
            <CustomSelect value={formData.addUpsell} onChange={(v) => updateField("addUpsell", v)} options={yesNoOptions} placeholder="No" />
          </div>
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
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800">Payment Methods</h3>
            <Toggle checked={formData.paymentMethodsEnabled} onChange={(v) => updateField("paymentMethodsEnabled", v)} />
          </div>

          {formData.paymentMethodsEnabled && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Method Text</label>
                <input
                  type="text"
                  value={formData.selectMethodText}
                  onChange={(e) => updateField("selectMethodText", e.target.value)}
                  placeholder="SELECT A PAYMENT METHOD"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Message for Paying Online (leave blank if none)</label>
                <input
                  type="text"
                  value={formData.discountMessageOnline}
                  onChange={(e) => updateField("discountMessageOnline", e.target.value)}
                  placeholder="eg Pay only N12,000 if you pay online OR Get N5,000 discount if you pay online"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Amount for Paying Online</label>
                <input
                  type="text"
                  value={formData.discountAmountOnline}
                  onChange={(e) => updateField("discountAmountOnline", e.target.value)}
                  placeholder="eg 5000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Amount for Paying Online</label>
                  <input
                    type="text"
                    value={formData.discountAmountOnline2}
                    onChange={(e) => updateField("discountAmountOnline2", e.target.value)}
                    placeholder="eg 5000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Any Commitment Fee? Type Amount</label>
                  <input
                    type="text"
                    value={formData.commitmentFee}
                    onChange={(e) => updateField("commitmentFee", e.target.value)}
                    placeholder="eg 5000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-400 outline-none focus:border-purple-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select States To EXCLUDE From Paying Commitment Fee (Leave bank if none)</label>
                <input
                  type="text"
                  value={formData.selectStatesExclude}
                  onChange={(e) => updateField("selectStatesExclude", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-purple-300"
                />
              </div>
            </>
          )}
        </div>

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
            className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md text-sm transition-colors"
          >
            Add Form
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
