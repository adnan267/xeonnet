"use client";
import { Check, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import RemoteTabs from "@/components/panel/RemoteTabs";
import { Coins, rs, SubStatus, type RSub } from "@/components/panel/remote";
import { Empty, Flash, Modal, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdatetime } from "@/lib/format";

type Overview = { workers: number; to_review: number; withdrawals: number; withdrawals_rupees: string; active_tasks: number; coins_in_wallets: number; coins_in_wallets_rupees: string; paid_rupees: string; coin_value: string };

export default function ReviewWork() {
  useTitle("Remote work");
  const { can } = useMe();
  const [status, setStatus] = useState("pending");
  const [o, reloadO] = useLoad<Overview>("staff/remote/overview");
  const [rows, reload, err] = useLoad<RSub[]>(`staff/remote/submissions?status=${status}`, [status]);
  const [review, setReview] = useState<{ sub: RSub; mode: "approve" | "reject" } | null>(null);
  const [coins, setCoins] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("remote", true);

  function open(sub: RSub, mode: "approve" | "reject") { setReview({ sub, mode }); setCoins(String(sub.task_coins)); setNote(""); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!review) return;
    try {
      const body = review.mode === "approve" ? { coins, note } : { note };
      await api(`staff/remote/submissions/${review.sub.id}/${review.mode}`, { body });
      setMsg({ ok: true, text: review.mode === "approve" ? `Approved: ${coins} coins added to ${review.sub.worker_name}.` : "Sent back for changes." });
      setReview(null); reload(); reloadO();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <RemoteTabs counts={o ?? undefined} />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      {o && (
        <div className="kpis" style={{ marginBottom: 20 }}>
          <div className="kpi"><b>{o.to_review}</b><span>Work to review</span></div>
          <div className="kpi"><b>{o.workers}</b><span>Active workers</span></div>
          <div className="kpi"><b>{o.active_tasks}</b><span>Open tasks</span></div>
          <div className="kpi"><b>{o.coins_in_wallets.toLocaleString()}</b><span>Coins in wallets ({rs(o.coins_in_wallets_rupees)})</span></div>
          <div className="kpi"><b>{rs(o.withdrawals_rupees)}</b><span>{o.withdrawals} withdrawals to pay</span></div>
          <div className="kpi"><b>{rs(o.paid_rupees)}</b><span>Paid out so far</span></div>
        </div>
      )}
      <div className="toolbar"><div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Waiting for review</option><option value="approved">Approved</option><option value="rejected">Sent back</option><option value="all">All</option></select>
      </div></div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>{status === "pending" ? "Nothing to review. 🎉" : "Nothing here."}</Empty> : (
        <div className="stack">
          {rows?.map((r) => (
            <div key={r.id} className="panel stack" style={{ ["--gap" as string]: "10px" }}>
              <div className="row between">
                <div><b>{r.task_title}</b><br /><span className="muted small">{r.worker_name} · {r.worker_email} · {fdatetime(r.created_at)}</span></div>
                <div className="row"><Coins n={r.status === "approved" ? r.coins : r.task_coins} /><SubStatus s={r.status} /></div>
              </div>
              {r.text && <div className="pre small card card-pad" style={{ padding: 14, maxHeight: 260, overflow: "auto" }}>{r.text}</div>}
              {r.link && <a className="link small" href={r.link} target="_blank" rel="noopener noreferrer">{r.link} <ExternalLink size={13} /></a>}
              {r.review_note && <p className="small" style={{ margin: 0 }}><b>Note:</b> {r.review_note}{r.reviewed_by_name ? ` (${r.reviewed_by_name})` : ""}</p>}
              {write && r.status === "pending" && (
                <div className="row">
                  <button className="btn btn-sm" onClick={() => open(r, "approve")}><Check /> Approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => open(r, "reject")}><X /> Needs changes</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {review && (
        <Modal title={review.mode === "approve" ? "Approve work" : "Send back for changes"} onClose={() => setReview(null)}>
          <form onSubmit={submit} className="stack">
            <p className="muted small" style={{ margin: 0 }}>{review.sub.worker_name} · {review.sub.task_title}</p>
            {review.mode === "approve" && <label className="field">Coins to give<input type="number" min={0} required value={coins} onChange={(e) => setCoins(e.target.value)} />
              <small className="muted">Task pays {review.sub.task_coins}. You can give less for partial work or more as a reward.{o ? ` = ${rs(Number(coins || 0) * Number(o.coin_value))}` : ""}</small></label>}
            <label className="field">{review.mode === "approve" ? "Note (optional)" : "What should they change? *"}<textarea rows={4} required={review.mode === "reject"} value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <div className="row"><button className="btn">{review.mode === "approve" ? "Approve & add coins" : "Send back"}</button><button type="button" className="btn btn-ghost" onClick={() => setReview(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
