export type ClientT = {
  id: number; name: string; company: string; email: string; phone: string; country: string; address: string; notes: string;
  notify_email: boolean; notify_sms: boolean; has_portal: boolean; doc_count?: number; created_at: string;
};

export type Totals = { subtotal: string; discount: string; tax: string; total: string; paid: string; balance: string };
export type Item = { description: string; qty: string; unit_price: string };
export type PaymentT = { id: number; amount: string; paid_on: string; method: string; note: string };

export type DocListItem = {
  id: number; doc_type: "proposal" | "invoice"; number: string; client: number; client_name: string; client_company: string;
  title: string; issue_date: string; due_date: string | null; currency: string; status: string; display_status: string; totals: Totals;
};

export type Doc = {
  id: number; doc_type: "proposal" | "invoice"; number: string; title: string; issue_date: string; due_date: string | null;
  currency: string; discount_type: string; discount_value: string; tax_percent: string; status: string; display_status: string;
  intro: string; scope: string; timeline: string; terms: string; notes: string; token?: string | null; client?: number;
  client_detail: { id: number; name: string; company: string; email: string; phone: string; address: string; country: string };
  items: Item[]; payments: PaymentT[]; totals: Totals; words: string; bank: { label: string; value: string }[];
  accepted_at: string | null; sent_at: string | null; source?: number | null; project?: number | null;
};

export type Cert = {
  id?: number; code: string; holder_name: string; doc_type: string; title: string; duration: string;
  start_date: string | null; end_date: string | null; period: string; issued_on: string; status?: string; note?: string; created_at?: string;
};

export type UserMini = { id: number; name: string; email: string; role: string; job_title: string };

export type TaskT = {
  id: number; project: number; project_title: string; title: string; description: string; assignee: number | null;
  assignee_detail: UserMini | null; status: "todo" | "doing" | "done"; priority: string; due_date: string | null; visible_to_client: boolean;
};

export type ProjectT = {
  id: number; client: number; client_name: string; title: string; description: string; status: string; start_date: string | null;
  due_date: string | null; manager: number | null; manager_detail: UserMini | null; members_detail: UserMini[];
  visible_to_client: boolean; progress: number; task_counts: { todo: number; doing: number; done: number };
};

export type UpdateT = { id: number; project: number; author_name: string; text: string; visible_to_client: boolean; created_at: string };

export type MessageT = { id: number; name: string; email: string; phone: string; service: string; budget: string; message: string; is_read: boolean; created_at: string };

export type Dashboard = {
  billing?: { invoiced: string; received: string; outstanding: string; overdue: number; proposals_open: number; proposals_won: number };
  recent_documents?: DocListItem[];
  inbox?: { unread: number; pending_reviews: number; subscribers: number };
  projects?: { active: number };
  my_tasks: TaskT[];
  certificates?: number;
};

export type PublicCert = Cert & { found?: boolean };
