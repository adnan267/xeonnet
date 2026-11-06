"use client";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Doc } from "@/components/DocPaper";
import ClientForm, { blankClient, type C } from "@/components/panel/ClientForm";
import { useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { addDays, money, today } from "@/lib/format";
import { allServices } from "@/lib/content";

type Item = { description: string; qty: string; unit_price: string };
const CURRENCIES = ["PKR", "GBP", "USD", "EUR", "AED", "SAR"];

export default function DocumentEditor({ doc, type, clientId }: { doc?: Doc; type: "proposal" | "invoice"; clientId?: string }) {
  const router = useRouter();
  const [clients, reloadClients] = useLoad<C[]>("staff/clients");
  const [defs] = useLoad<{ proposal_terms: string; invoice_terms: string; next_invoice: string; next_proposal: string }>("staff/documents/defaults");
  const [addClient, setAddClient] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    client: doc?.client ? String(doc.client) : clientId || "",
    title: doc?.title || "", issue_date: doc?.issue_date || today(),
    due_date: doc?.due_date || addDays(type === "invoice" ? 14 : 30), currency: doc?.currency || "PKR",
    discount_type: doc?.discount_type || "amount", discount_value: doc ? String(Number(doc.discount_value)) : "0",
    tax_percent: doc ? String(Number(doc.tax_percent)) : "0",
    intro: doc?.intro ?? (type === "proposal" ? "Thank you for the opportunity to work with you. This proposal outlines the scope, timeline and investment for your project." : ""),
    scope: doc?.scope || "", timeline: doc?.timeline || "", terms: doc?.terms ?? "", notes: doc?.notes || "",
  });
  const [items, setItems] = useState<Item[]>(doc?.items.map((i) => ({ description: i.description, qty: String(Number(i.qty)), unit_price: String(Number(i.unit_price)) })) || [{ description: "", qty: "1", unit_price: "0" }]);

  useEffect(() => { if (!doc && defs && !f.terms) setF((x) => ({ ...x, terms: type === "invoice" ? defs.invoice_terms : defs.proposal_terms })); }, [defs]); // eslint-disable-line

  const t = useMemo(() => {
    const sub = items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.unit_price) || 0), 0);
    const dv = Number(f.discount_value) || 0;
    const disc = f.discount_type === "percent" ? sub * Math.min(dv, 100) / 100 : Math.min(dv, sub);
    const tax = (sub - disc) * (Number(f.tax_percent) || 0) / 100;
    return { sub, disc, tax, total: sub - disc + tax };
  }, [items, f]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const setItem = (i: number, k: keyof Item, v: string) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const body = { ...f, doc_type: type, client: Number(f.client), due_date: f.due_date || null, items: items.filter((i) => i.description.trim()) };
    try {
      const saved = await api<Doc>(doc ? `staff/documents/${doc.id}` : "staff/documents", { method: doc ? "PUT" : "POST", body });
      router.push(`/staff/documents/${saved.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  return (
    <form onSubmit={save} className="stack" style={{ ["--gap" as string]: "18px", maxWidth: 1000 }}>
      {err && <p className="alert alert-err">{err}</p>}
      {!doc && defs && <p className="muted small">This {type} will be numbered <b>{type === "invoice" ? defs.next_invoice : defs.next_proposal}</b>.</p>}
      <section className="panel stack">
        <div className="form-grid">
          <label className="field">Client *
            <select required value={f.client} onChange={set("client")}>
              <option value="">Choose a client…</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
            </select>
            <button type="button" className="link small" style={{ justifySelf: "start" }} onClick={() => setAddClient(true)}>+ New client</button>
          </label>
          <label className="field">Title / project<input value={f.title} onChange={set("title")} placeholder="e.g. Social media management" /></label>
          <label className="field">Issue date<input type="date" value={f.issue_date} onChange={set("issue_date")} /></label>
          <label className="field">{type === "proposal" ? "Valid until" : "Due date"}<input type="date" value={f.due_date || ""} onChange={set("due_date")} /></label>
          <label className="field">Currency<select value={f.currency} onChange={set("currency")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Items</h3>
        <datalist id="svc">{allServices.map((s) => <option key={s.slug} value={s.title} />)}</datalist>
        <div className="items-head"><span>Description</span><span>Qty</span><span>Unit price</span><span style={{ textAlign: "right" }}>Amount</span><span /></div>
        {items.map((it, i) => (
          <div key={i} className="item-row">
            <input list="svc" placeholder="Service or product" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} aria-label="Description" />
            <input type="number" step="any" min="0" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} aria-label="Quantity" />
            <input type="number" step="any" min="0" value={it.unit_price} onChange={(e) => setItem(i, "unit_price", e.target.value)} aria-label="Unit price" />
            <span className="amt">{money((Number(it.qty) || 0) * (Number(it.unit_price) || 0), f.currency)}</span>
            <button type="button" className="icon-btn" aria-label="Remove item" onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : [{ description: "", qty: "1", unit_price: "0" }])}><Trash2 /></button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItems([...items, { description: "", qty: "1", unit_price: "0" }])}><Plus /> Add item</button>
        <div className="grid" style={{ ["--min" as string]: "280px", marginTop: 22, alignItems: "start" }}>
          <div className="form-grid">
            <label className="field">Discount
              <span className="row" style={{ flexWrap: "nowrap", ["--gap" as string]: "8px" }}>
                <input type="number" step="any" min="0" value={f.discount_value} onChange={set("discount_value")} />
                <select value={f.discount_type} onChange={set("discount_type")} style={{ width: 110 }}><option value="amount">Amount</option><option value="percent">%</option></select>
              </span>
            </label>
            <label className="field">Tax %<input type="number" step="any" min="0" value={f.tax_percent} onChange={set("tax_percent")} /></label>
          </div>
          <dl className="sum">
            <div><dt>Subtotal</dt><dd>{money(t.sub, f.currency)}</dd></div>
            <div><dt>Discount</dt><dd>− {money(t.disc, f.currency)}</dd></div>
            <div><dt>Tax</dt><dd>{money(t.tax, f.currency)}</dd></div>
            <div className="grand"><dt>Total</dt><dd>{money(t.total, f.currency)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="panel stack">
        {type === "proposal" && <>
          <label className="field">Introduction<textarea rows={3} value={f.intro} onChange={set("intro")} /></label>
          <label className="field">Scope of work <small>(one point per line)</small><textarea rows={6} value={f.scope} onChange={set("scope")} /></label>
          <label className="field">Timeline <small>(one point per line)</small><textarea rows={4} value={f.timeline} onChange={set("timeline")} /></label>
        </>}
        <label className="field">Terms &amp; conditions <small>(one point per line)</small><textarea rows={4} value={f.terms} onChange={set("terms")} /></label>
        <label className="field">Notes to client<textarea rows={2} value={f.notes} onChange={set("notes")} /></label>
      </section>

      <div className="row" style={{ position: "sticky", bottom: 0, padding: "12px 0", background: "linear-gradient(transparent, var(--bg) 35%)" }}>
        <button className="btn" disabled={busy}>{busy ? "Saving…" : `Save ${type}`}</button>
        <Link className="btn btn-ghost" href={doc ? `/staff/documents/${doc.id}` : "/staff/documents"}>Cancel</Link>
      </div>

      {addClient && <ClientForm initial={{ ...blankClient }} onClose={() => setAddClient(false)} onSaved={(c) => { setAddClient(false); reloadClients(); setF((x) => ({ ...x, client: String(c.id) })); }} />}
    </form>
  );
}
