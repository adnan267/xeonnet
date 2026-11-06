import { company } from "@/lib/content";
import { fdate, money } from "@/lib/format";

export type Doc = {
  id: number; doc_type: "proposal" | "invoice"; number: string; title: string; issue_date: string; due_date: string | null;
  currency: string; discount_type: string; discount_value: string; tax_percent: string; status: string; display_status: string;
  intro: string; scope: string; timeline: string; terms: string; notes: string; token?: string | null; client?: number;
  client_detail: { id: number; name: string; company: string; email: string; phone: string; address: string; country: string };
  items: { description: string; qty: string; unit_price: string }[];
  payments: { id: number; amount: string; paid_on: string; method: string; note: string }[];
  totals: { subtotal: string; discount: string; tax: string; total: string; paid: string; balance: string };
  words: string; bank: { label: string; value: string }[]; accepted_at: string | null; sent_at: string | null;
  source?: number | null; project?: number | null;
};

const lines = (t: string) => (t || "").split("\n").map((x) => x.trim()).filter(Boolean);
const n = (v: string | number) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function DocPaper({ d }: { d: Doc }) {
  const c = d.client_detail;
  const t = d.totals;
  const cur = d.currency;
  return (
    <article className="paper">
      <header className="head">
        <img src="/img/logo-full-light.png" alt="Xeon Net — Full Stack Development & Digital Solution" />
        <div className="title">
          <h1>{d.doc_type.toUpperCase()}</h1>
          <p>{d.number}</p>
          <span className={`pill st-${d.display_status}`}>{d.display_status}</span>
        </div>
      </header>
      <section className="meta">
        <div><h5>From</h5><p><b>{company.name}</b><br />{company.address}<br />{company.phone}<br />{company.email}<br />{company.domain}</p></div>
        <div><h5>{d.doc_type === "proposal" ? "Prepared for" : "Bill to"}</h5>
          <p><b>{c.name}</b>{c.company && <><br />{c.company}</>}{c.address && <><br />{c.address}</>}{c.phone && <><br />{c.phone}</>}{c.email && <><br />{c.email}</>}</p></div>
        <div><h5>Details</h5><p>Issued: <b>{fdate(d.issue_date)}</b>{d.due_date && <><br />{d.doc_type === "proposal" ? "Valid until" : "Due"}: <b>{fdate(d.due_date)}</b></>}<br />Currency: <b>{cur}</b></p></div>
      </section>
      {d.title && <h2 className="project">{d.title}</h2>}
      {d.intro && <p style={{ color: "#444" }}>{d.intro}</p>}
      <table>
        <thead><tr><th className="hide-xs">#</th><th>Description</th><th className="r">Qty</th><th className="r">Unit price</th><th className="r">Amount</th></tr></thead>
        <tbody>
          {d.items.map((i, k) => (
            <tr key={k}><td className="hide-xs">{k + 1}</td><td>{i.description}</td><td className="r">{n(i.qty)}</td><td className="r">{money(i.unit_price, cur)}</td><td className="r">{money(Number(i.qty) * Number(i.unit_price), cur)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="sumbox">
        <div><h5>Amount in words</h5><p style={{ color: "#555", fontSize: 13 }}>{d.words}</p></div>
        <dl>
          <div><dt>Subtotal</dt><dd>{money(t.subtotal, cur)}</dd></div>
          {Number(t.discount) > 0 && <div><dt>Discount{d.discount_type === "percent" ? ` (${n(d.discount_value)}%)` : ""}</dt><dd>− {money(t.discount, cur)}</dd></div>}
          {Number(t.tax) > 0 && <div><dt>Tax ({n(d.tax_percent)}%)</dt><dd>{money(t.tax, cur)}</dd></div>}
          <div className="grand"><dt>Total</dt><dd>{money(t.total, cur)}</dd></div>
          {d.doc_type === "invoice" && Number(t.paid) > 0 && <>
            <div><dt>Paid</dt><dd>− {money(t.paid, cur)}</dd></div>
            <div className="grand"><dt>Balance due</dt><dd>{money(t.balance, cur)}</dd></div>
          </>}
        </dl>
      </div>
      {lines(d.scope).length > 0 && <section className="block"><h5>Scope of work</h5><ul>{lines(d.scope).map((l) => <li key={l}>{l}</li>)}</ul></section>}
      {lines(d.timeline).length > 0 && <section className="block"><h5>Timeline</h5><ul>{lines(d.timeline).map((l) => <li key={l}>{l}</li>)}</ul></section>}
      {d.doc_type === "invoice" && d.payments.length > 0 && (
        <section className="block"><h5>Payments received</h5><ul>{d.payments.map((p) => <li key={p.id}>{fdate(p.paid_on)} · {money(p.amount, cur)}{p.method && ` · ${p.method}`}</li>)}</ul></section>
      )}
      {d.doc_type === "invoice" && d.bank.length > 0 && (
        <section className="block"><h5>Payment details</h5><p>{d.bank.map((b) => <span key={b.label}>{b.label}: <b>{b.value}</b><br /></span>)}</p></section>
      )}
      {lines(d.terms).length > 0 && <section className="block"><h5>Terms &amp; conditions</h5><ul>{lines(d.terms).map((l) => <li key={l}>{l}</li>)}</ul></section>}
      {d.notes && <section className="block"><h5>Notes</h5><p style={{ whiteSpace: "pre-line" }}>{d.notes}</p></section>}
      <footer className="foot">
        <div className="sign"><span /><b>{company.ceo}</b><small>CEO, {company.name}</small></div>
        {d.doc_type === "proposal" && <div className="sign"><span />{d.accepted_at ? <b>Accepted online · {fdate(d.accepted_at)}</b> : <b>Client approval</b>}<small>Signature &amp; date</small></div>}
        <p className="thanks">Thank you for choosing {company.name} · {company.phone} · {company.email}</p>
      </footer>
    </article>
  );
}
