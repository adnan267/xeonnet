const SYMBOL: Record<string, string> = { PKR: "Rs ", GBP: "£", USD: "$", EUR: "€", AED: "AED ", SAR: "SAR " };

export function money(v: string | number | null | undefined, cur = "PKR") {
  const n = Number(v ?? 0);
  const s = n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return `${SYMBOL[cur] ?? cur + " "}${s}`;
}

function parse(v: string) { return new Date(v.length <= 10 ? v + "T00:00:00" : v); }

/** 09 Nov 2026 */
export function fdate(v?: string | null) {
  if (!v) return "";
  const d = parse(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** 9 November 2026 (certificates) */
export function longDate(v?: string | null) {
  if (!v) return "";
  const d = parse(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function ago(v?: string | number | null) {
  if (!v) return "";
  const ms = Date.now() - (typeof v === "number" ? v : new Date(v).getTime());
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} day${d > 1 ? "s" : ""} ago` : fdate(new Date(v).toISOString());
}

/** yyyy-mm-dd for today in the phone's time zone */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const d = parse(iso); d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(parse(v).getTime());

/** "3 Months" / "2 Weeks" from two yyyy-mm-dd dates (same rule as the server). */
export function workOutDuration(start: string, end: string) {
  if (!isIsoDate(start) || !isIsoDate(end)) return "";
  const days = Math.round((parse(end).getTime() - parse(start).getTime()) / 864e5) + 1;
  if (days <= 0) return "";
  if (days >= 28) { const n = Math.max(1, Math.round(days / 30.44)); return `${n} Month${n > 1 ? "s" : ""}`; }
  const n = Math.max(1, Math.round(days / 7)); return `${n} Week${n > 1 ? "s" : ""}`;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", sent: "Sent", accepted: "Accepted", rejected: "Rejected", paid: "Paid", partial: "Part paid",
  overdue: "Overdue", cancelled: "Cancelled", expired: "Expired", planning: "Planning", active: "In progress",
  on_hold: "On hold", hold: "On hold", review: "In review", done: "Done", todo: "To do", doing: "Doing", valid: "Valid", revoked: "Revoked",
};
export const label = (s: string) => STATUS_LABEL[s] ?? s.replace(/_/g, " ");
