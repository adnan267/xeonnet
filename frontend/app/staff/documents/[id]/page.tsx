"use client";
import { Copy, Mail, MessageCircle, Pencil, Printer, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import DocPaper, { type Doc } from "@/components/DocPaper";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Flash, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { company } from "@/lib/content";
import { fdate, fdatetime, money, today, waLink } from "@/lib/format";

type Log = { id: number; kind: string; channel: string; to: string; status: string; error: string; created_at: string };
type SendResult = { channel: string; status: string; to?: string; error: string }[];

export default function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useMe();
  const [d, reload, err, setD] = useLoad<Doc>(`staff/documents/${id}`);
  const [logs, reloadLogs] = useLoad<Log[]>(`staff/documents/${id}/notifications`);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pay, setPay] = useState({ amount: "", paid_on: today(), method: "Bank transfer", note: "", notify: true });
  const [busy, setBusy] = useState(false);
  useTitle(d ? d.number : "Document");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!d) return <p className="muted">Loading…</p>;

  const write = can("documents", true);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/d/${d.token}`;
  const label = d.doc_type === "invoice" ? "invoice" : "proposal";
  const shareText = `Hello ${d.client_detail.name}, please find your ${label} ${d.number} from ${company.name} (${money(d.totals.total, d.currency)}): ${link}`;
  const report = (sent: SendResult, what: string) => {
    const ok = sent.filter((s) => s.status === "sent").map((s) => s.channel.toUpperCase());
    const bad = sent.filter((s) => s.status !== "sent").map((s) => `${s.channel.toUpperCase()} failed (${s.error})`);
    setMsg({ ok: !bad.length, text: `${what}. ${ok.length ? "Sent by " + ok.join(" + ") + "." : "No email/SMS sent."} ${bad.join(" ")}` });
  };

  async function run(path: string, body: unknown = {}) {
    setBusy(true);
    try { return await api(path, { body }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  }
  async function send(notify: boolean) {
    const r = await run(`staff/documents/${id}/send`, { notify });
    if (r) { setD(r.document); report(r.sent, notify ? `Marked as sent` : "Marked as sent (no message)"); reloadLogs(); }
  }
  async function setStatus(s: string) { const r = await run(`staff/documents/${id}/set_status`, { status: s }); if (r) setD(r); }
  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    const r = await run(`staff/documents/${id}/payments`, pay);
    if (r) { setD(r.document); report(r.sent, "Payment recorded"); setPay({ ...pay, amount: "", note: "" }); reloadLogs(); }
  }
  async function delPayment(pid: number) {
    if (!confirm("Remove this payment?")) return;
    await api(`staff/payments/${pid}`, { method: "DELETE" }).catch((e) => setMsg({ ok: false, text: e.message }));
    reload();
  }
  async function clone(kind: "duplicate" | "convert") { const r = await run(`staff/documents/${id}/${kind}`); if (r) router.push(`/staff/documents/${r.id}`); }
  async function remove() {
    if (!confirm(`Delete ${d!.number} permanently?`)) return;
    await api(`staff/documents/${id}`, { method: "DELETE" }).then(() => router.push("/staff/documents")).catch((e) => setMsg({ ok: false, text: e.message }));
  }

  return (
    <>
      <div className="toolbar no-print">
        <Link href="/staff/documents" className="btn btn-ghost btn-sm">← All documents</Link>
        <div className="row">
          <button className="btn btn-sm" onClick={() => window.print()}><Printer /> Print / PDF</button>
          {write && <Link className="btn btn-ghost btn-sm" href={`/staff/documents/${id}/edit`}><Pencil /> Edit</Link>}
          <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener" href={waLink(d.client_detail.phone, shareText)}><MessageCircle /> WhatsApp</a>
          <a className="btn btn-ghost btn-sm" href={`mailto:${d.client_detail.email}?subject=${encodeURIComponent(`${d.doc_type === "invoice" ? "Invoice" : "Proposal"} ${d.number} from ${company.name}`)}&body=${encodeURIComponent(shareText)}`}><Mail /> Email app</a>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(link); setMsg({ ok: true, text: "Client link copied." }); }}><Copy /> Copy link</button>
        </div>
      </div>
      <div className="no-print"><Flash msg={msg} onDone={() => setMsg(null)} /></div>
      <div className="split">
        <div><DocPaper d={d} /></div>
        <aside className="stack no-print">
          <section className="panel stack" style={{ ["--gap" as string]: "12px" }}>
            <div className="row between"><b>Status</b><Status s={d.display_status} /></div>
            {write && <>
              <button className="btn btn-sm" disabled={busy} onClick={() => send(true)}><Send /> {d.sent_at ? "Send again" : "Send to client"} (email + SMS)</button>
              {!d.sent_at && <button className="link small" style={{ justifySelf: "start" }} onClick={() => send(false)}>Mark as sent without messaging</button>}
              <label className="field">Change status
                <select value={d.status} onChange={(e) => setStatus(e.target.value)}>
                  {(d.doc_type === "proposal" ? ["draft", "sent", "accepted", "rejected"] : ["draft", "sent", "cancelled"]).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </>}
            <p className="muted small">{d.sent_at ? `Sent ${fdatetime(d.sent_at)}.` : "Not sent yet — the client link only works after it is sent."} {d.doc_type === "invoice" ? "Overdue / paid update automatically. Reminders go out before the due date and when overdue." : "The client can accept online."}</p>
          </section>

          {d.doc_type === "proposal" && write && (
            <section className="panel"><button className="btn btn-sm" style={{ width: "100%" }} disabled={busy} onClick={() => clone("convert")}>Create invoice from this proposal</button></section>
          )}

          {d.doc_type === "invoice" && (
            <section className="panel stack" id="payments" style={{ ["--gap" as string]: "10px" }}>
              <h3 className="panel-title" style={{ margin: 0 }}>Payments</h3>
              <p className="small muted">Total {money(d.totals.total, d.currency)} · Paid {money(d.totals.paid, d.currency)} · <b style={{ color: "var(--text)" }}>Balance {money(d.totals.balance, d.currency)}</b></p>
              {d.payments.map((p) => (
                <div key={p.id} className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                  <span><b>{money(p.amount, d.currency)}</b><br /><span className="muted small">{fdate(p.paid_on)} · {p.method || "—"}{p.note && ` · ${p.note}`}</span></span>
                  {can("payments", true) && <button className="link danger small" onClick={() => delPayment(p.id)}>Remove</button>}
                </div>
              ))}
              {can("payments", true) && Number(d.totals.balance) > 0 && (
                <form onSubmit={addPayment} className="stack" style={{ ["--gap" as string]: "10px", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <label className="field">Amount received<input type="number" step="any" min="0" required value={pay.amount} placeholder={String(Number(d.totals.balance))} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></label>
                  <div className="form-grid" style={{ ["--gap" as string]: "10px" }}>
                    <label className="field">Date<input type="date" value={pay.paid_on} onChange={(e) => setPay({ ...pay, paid_on: e.target.value })} /></label>
                    <label className="field">Method<select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{["Bank transfer", "Cash", "Cheque", "JazzCash", "Easypaisa", "Card / Online", "Other"].map((m) => <option key={m}>{m}</option>)}</select></label>
                  </div>
                  <label className="field">Note<input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="Optional" /></label>
                  <label className="check"><input type="checkbox" checked={pay.notify} onChange={(e) => setPay({ ...pay, notify: e.target.checked })} /> Send receipt to client</label>
                  <button className="btn btn-sm" disabled={busy}>Record payment</button>
                </form>
              )}
            </section>
          )}

          <section className="panel stack" style={{ ["--gap" as string]: "8px" }}>
            <h3 className="panel-title" style={{ margin: 0 }}>Emails &amp; SMS</h3>
            {!logs?.length && <p className="muted small">Nothing sent yet.</p>}
            {logs?.map((l) => <div key={l.id} className="small"><Status s={l.status === "sent" ? "ok" : "failed"} /> {l.channel.toUpperCase()} · {l.kind.replace(/_/g, " ")} · {fdatetime(l.created_at)}<br /><span className="muted">{l.to}{l.error && ` — ${l.error}`}</span></div>)}
          </section>

          {write && <section className="panel row">
            <button className="btn btn-ghost btn-sm" onClick={() => clone("duplicate")}>Duplicate</button>
            <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>
          </section>}
        </aside>
      </div>
    </>
  );
}
