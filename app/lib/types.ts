// Supabase Database Types
export interface Profile {
  id: string;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "unpaid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  number: string;
  status: InvoiceStatus;
  date: string;
  due_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  clients?: Client;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
}
