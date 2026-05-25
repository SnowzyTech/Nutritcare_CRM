export interface SavedForm {
  id: string;
  formName: string;
  createdAt: string;
  hits: number;
  orders: number;
  data: Record<string, unknown>;
}
