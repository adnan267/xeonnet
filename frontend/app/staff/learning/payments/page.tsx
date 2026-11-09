"use client";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import LearnTabs from "@/components/panel/LearnTabs";
import { Empty, Flash, Modal, Status, useLoad } from "@/components/panel/ui";
import { rs } from "@/components/learn/shared";
import { api } from "@/lib/api";
import { fdatetime } from "@/lib/format";

type P = { id: number; enrollment: number; method: string; method_label: string; amount: string; reference: string; payer_name: string; has_proof: boolean; proof?: string; status: string; staff_note: string; created_at: string; student_name: string; student_email: string; student_phone: string; course_title: string };

export default function FeePayments() {
  useTitle("Course fees");
  const { can } = useMe();
  const [status, setStatus] = useState("pending");
  const [rows, reload, err] = useLoad<P[]>(`staff/learn/payments?status=${status}`, [status]);
  const [open, setOpen] = useState<P | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("fees", true);

  async function show(p: P) { setNote(""); setOpen(p); setOpen(await api<P>(`staff/learn/payments/${p.id}`)); }
  async function act(kind: "approve" | "reject") {
    try {
      await api(`staff/learn/payments/${open!.id}/${kind}`, { body: { note } });
      setMsg({ ok: true, text: kind === "approve" ? `Approved: ${open!.course_title} is now open for ${open!.student_name}.` : "Rejected: the student was told why." });
      setOpen(null); reload();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <LearnTabs />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar"><div className="filters"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">To check</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option></select></div></div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>{status === "pending" ? "No payments waiting." : "Nothing here."}</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Student</th><th>Course</th><th>Payment</th><th className="r">Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows?.map((p) => (
            <tr key={p.id}>
              <td><b>{p.student_name}</b><br /><span className="muted small">{p.student_phone || p.student_email}</span></td>
              <td className="small">{p.course_title}</td>
              <td className="small">{p.method_label}{p.reference ? <> · ID <b>{p.reference}</b></> : null}{p.payer_name ? <><br />{p.payer_name}</> : null}<br /><span className="muted">{fdatetime(p.created_at)}{p.has_proof ? " · screenshot" : ""}</span></td>
              <td className="r"><b>{rs(p.amount)}</b></td>
              <td><Status s={p.status === "pending" ? "pending" : p.status} label={{ pending: "to check", approved: "approved", rejected: "rejected" }[p.status]} /></td>
              <td><button className="link small" onClick={() => show(p)}>{p.status === "pending" && write ? "Check" : "View"}</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {open && (
        <Modal title={`${open.student_name} · ${rs(open.amount)}`} onClose={() => setOpen(null)} wide>
          <div className="stack">
            <p className="small" style={{ margin: 0 }}>{open.course_title} · {open.method_label}{open.reference ? ` · Transaction ID ${open.reference}` : ""}{open.payer_name ? ` · from ${open.payer_name}` : ""}</p>
            {open.proof ? /* eslint-disable-next-line @next/next/no-img-element */ <a href={open.proof} target="_blank" rel="noopener"><img src={open.proof} alt="Payment screenshot" style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 12, border: "1px solid var(--line)" }} /></a>
              : open.has_proof ? <p className="muted small">Loading screenshot…</p> : <p className="muted small">No screenshot: check the transaction ID in your JazzCash / Easypaisa / bank app.</p>}
            {open.staff_note && <p className="small">Note: {open.staff_note}</p>}
            {write && open.status === "pending" && (
              <>
                <label className="field">Note <small>(needed to reject; the student sees it)</small><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
                <div className="row"><button className="btn" onClick={() => act("approve")}>Payment received: open course</button><button className="btn btn-ghost" onClick={() => act("reject")} disabled={!note.trim()}>Reject</button></div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
