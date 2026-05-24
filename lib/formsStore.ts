// Simple client-side forms store — localStorage backed, no backend

export interface SavedForm {
  id: string;
  formName: string;
  createdAt: string;
  hits: number;
  orders: number;
  // raw form data blob
  data: Record<string, unknown>;
}

const STORAGE_KEY = "nutritcare_forms";

export function getForms(): SavedForm[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveForm(data: Record<string, unknown>): SavedForm {
  const forms = getForms();
  const newForm: SavedForm = {
    id: `form_${Date.now()}`,
    formName: (data.formName as string) || "Untitled Form",
    createdAt: new Date().toISOString(),
    hits: 0,
    orders: 0,
    data,
  };
  forms.unshift(newForm);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  return newForm;
}

export function deleteForm(id: string): void {
  const forms = getForms().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

export function duplicateForm(id: string): SavedForm | null {
  const forms = getForms();
  const original = forms.find((f) => f.id === id);
  if (!original) return null;
  const copy: SavedForm = {
    ...original,
    id: `form_${Date.now()}`,
    formName: `${original.formName} (Copy)`,
    createdAt: new Date().toISOString(),
    hits: 0,
    orders: 0,
  };
  forms.unshift(copy);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  return copy;
}
