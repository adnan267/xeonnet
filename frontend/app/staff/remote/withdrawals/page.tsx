"use client";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import RemoteTabs from "@/components/panel/RemoteTabs";
import { rs, WdStatus, type RWithdrawal } from "@/components/panel/remote";
import { Empty, Flash, Modal, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdatetime } from "@/lib/format";

export default function Withdrawals() {
  useTitle("Payouts");
  const { can } = useMe();
  const [status, setStatus] = useState("pending");
  const [rows, reload, err] = useLoad<RWithdrawal[]>(`staff/remote/withdrawals?status=${status}`, [status]);
  const [act, setAct] = useState<{ w: RWithdrawal; mode: "paid" | "reject" } | null>(null);
  const [f, setF] = useState({ reference: "", note: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("payouts", true);
  const total = (rows ?? []).reduce((a, w) => a + Number(w.amount), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`staff/remote/withdrawals/${act!.w.id}/${act!.mode}`, { body: f });
      setMsg({ ok: true, text: act!.mode === "paid" ? `Marked as paid. ${act!.w.worker_name} has been told.` : "Rejected: coins returned to the worker." });
      setAct(null); reload();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <RemoteTabs />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar">
        <div className="filters"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">To pay</option><option value="paid">Paid</option><option value="rejected">Rejected</option><option value="all">All</option></select></div>
        {rows && rows.length > 0 && <span className="muted small">{rows.length} · total <b>{rs(total)}</b></span>}
      </div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>{status === "pending" ? "No payments waiting." : "Nothing here."}</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Worker</th><th>Send to</th><th className="r">Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows?.map((w) => (
            <tr key={w.id}>
              <td><b>{w.worker_name}</b><br /><span className="muted small">{w.worker_phone || w.worker_email} · {fdatetime(w.created_at)}</span></td>
              <td className="small"><b>{w.method_label}</b>{w.bank ? ` · ${w.bank}` : ""}<br />{w.account_name}<br />
                <button className="link small" onClick={() => { navigator.clipboard?.writeText(w.account_number); setMsg({ ok: true, text: "Number copied." }); }}>{w.account_number} <Copy size={12} /></button></td>
              <td className="r"><b>{rs(w.amount)}</b><br /><span className="muted small">{w.coins.toLocaleString()} coins</span></td>
              <td><WdStatus s={w.status} />{w.reference && <><br /><span className="small">TX: {w.reference}</span></>}{w.staff_note && <><br /><span className="muted small">{w.staff_note}</span></>}</td>
              <td>{write && w.status === "pending" && <div className="row" style={{ ["--gap" as string]: "6px 12px" }}>
                <button className="btn btn-sm" onClick={() => { setAct({ w, mode: "paid" }); setF({ reference: "", note: "" }); }}>Mark paid</button>
                <button className="link danger small" onClick={() => { setAct({ w, mode: "reject" }); setF({ reference: "", note: "" }); }}>Reject</button>
              </div>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {act && (
        <Modal title={act.mode === "paid" ? `Paid ${rs(act.w.amount)} to ${act.w.worker_name}?` : "Reject withdrawal"} onClose={() => setAct(null)}>
          <form onSubmit={submit} className="stack">
            <p className="small" style={{ margin: 0 }}>{act.w.method_label} · {act.w.account_name} · <b>{act.w.account_number}</b>{act.w.bank ? ` · ${act.w.bank}` : ""}</p>
            {act.mode === "paid"
              ? <><p className="muted small" style={{ margin: 0 }}>First send the money from JazzCash / Easypaisa / your bank, then record it here.</p>
                <label className="field">Transaction ID<input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></label></>
              : <p className="muted small" style={{ margin: 0 }}>The {act.w.coins.toLocaleString()} coins go back to the worker&apos;s wallet.</p>}
            <label className="field">{act.mode === "paid" ? "Note (optional)" : "Reason *"}<input required={act.mode === "reject"} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
            <div className="row"><button className="btn">{act.mode === "paid" ? "Mark as paid" : "Reject & return coins"}</button><button type="button" className="btn btn-ghost" onClick={() => setAct(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
