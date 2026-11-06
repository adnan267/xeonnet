export function money(amount: string | number | null | undefined, currency = "PKR") {
  const n = Number(amount || 0);
  const s = n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  return `${currency} ${s}`;
}

export function fdate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value.length <= 10 ? value + "T00:00:00" : value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fdatetime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function waLink(phone: string, text: string) {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "92" + d.slice(1);
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
