"use client";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import RemoteTabs from "@/components/panel/RemoteTabs";
import { rs, type REntry } from "@/components/panel/remote";
import { Empty, Flash, Modal, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdate, fdatetime, waLink } from "@/lib/format";

type W = { id: number; name: string; email: string; phone: string; position: number | null; position_title: string; city: string; skills: string; about: string; portfolio_url: string; status: string; staff_note: string; payout_method: string; method_label: string; payout_name: string; payout_number: string; payout_bank: string; joined_at: string; balance: number; approved: number; pending: number };
type Pos = { id: number; title: string };

export default function Workers() {
  useTitle("Remote workers");
  const { can } = useMe();
  const [q, setQ] = useState("");
  const [rows, reload, err] = useLoad<W[]>(`staff/remote/workers?q=${encodeURIComponent(q)}`, [q]);
  const [positions] = useLoad<Pos[]>("staff/remote/positions");
  const [open, setOpen] = useState<W | null>(null);
  const [hist, setHist] = useState<{ balance: number; entries: REntry[] } | null>(null);
  const [adj, setAdj] = useState({ coins: "", kind: "bonus", note: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("remote", true);

  async function show(w: W) {
    setOpen(w); setHist(null); setAdj({ coins: "", kind: "bonus", note: "" });
    setHist(await api(`staff/remote/workers/${w.id}/coins`));
  }
  async function update(body: Partial<W>) {
    try { const w = await api<W>(`staff/remote/workers/${open!.id}`, { method: "PATCH", body }); setOpen(w); reload(); setMsg({ ok: true, text: "Saved." }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function adjust(e: React.FormEvent) {
    e.preventDefault();
    try {
      const n = Number(adj.coins) * (adj.kind === "adjust" && Number(adj.coins) > 0 ? -1 : 1);
      setHist(await api(`staff/remote/workers/${open!.id}/coins`, { body: { ...adj, coins: n } }));
      setAdj({ coins: "", kind: "bonus", note: "" }); reload(); setMsg({ ok: true, text: "Coins updated." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <RemoteTabs />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar"><div className="filters"><input type="search" placeholder="Search name, email, phone or skill…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <a className="btn btn-ghost btn-sm" href="/careers" target="_blank">Careers page</a></div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>No remote workers yet. Share xeonnet.site/careers to get people joining.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Worker</th><th>Position</th><th>Work</th><th className="r">Coins</th><th></th></tr></thead>
          <tbody>{rows?.map((w) => (
            <tr key={w.id}>
              <td><b>{w.name}</b><br /><span className="muted small">{w.email} · {w.phone}{w.city ? ` · ${w.city}` : ""}</span></td>
              <td className="small">{w.position_title || "Any"}<br /><span className="muted">joined {fdate(w.joined_at)}</span></td>
              <td className="small">{w.approved} approved · {w.pending} waiting</td>
              <td className="r"><b>{w.balance.toLocaleString()}</b>{w.status !== "active" && <><br /><Status s="suspended" label="paused" /></>}</td>
              <td><button className="link small" onClick={() => show(w)}>Open</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {open && (
        <Modal title={open.name} onClose={() => setOpen(null)} wide>
          <div className="stack">
            <div className="split split-even">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <span className="small">{open.email}</span>
                <span className="small">{open.phone} {open.phone && <a className="link" href={waLink(open.phone, `Hi ${open.name}, `)} target="_blank" rel="noopener">WhatsApp</a>}</span>
                {open.skills && <span className="small"><b>Skills:</b> {open.skills}</span>}
                {open.portfolio_url && <a className="link small" href={open.portfolio_url} target="_blank" rel="noopener noreferrer">Portfolio <ExternalLink size={13} /></a>}
                {open.about && <p className="muted small pre" style={{ margin: 0 }}>{open.about}</p>}
                <span className="small"><b>Payout:</b> {open.payout_method ? `${open.method_label} · ${open.payout_name} · ${open.payout_number}${open.payout_bank ? ` · ${open.payout_bank}` : ""}` : "not added yet"}</span>
              </div>
              <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                <label className="field">Position<select disabled={!write} value={open.position ?? ""} onChange={(e) => update({ position: e.target.value ? Number(e.target.value) : null })}><option value="">Any</option>{positions?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
                <label className="field">Account<select disabled={!write} value={open.status} onChange={(e) => update({ status: e.target.value })}><option value="active">Active</option><option value="suspended">Paused (cannot send work or withdraw)</option></select></label>
                <label className="field">Staff note<textarea rows={2} disabled={!write} defaultValue={open.staff_note} onBlur={(e) => e.target.value !== open.staff_note && update({ staff_note: e.target.value })} /></label>
              </div>
            </div>
            <section className="panel">
              <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Coins</h3><b>{hist ? `${hist.balance.toLocaleString()} coins` : "…"}</b></div>
              {(can("payouts", true) || write) && (
                <form onSubmit={adjust} className="row" style={{ marginTop: 10, alignItems: "flex-end" }}>
                  <label className="field" style={{ width: 130 }}>Coins<input type="number" min={1} required value={adj.coins} onChange={(e) => setAdj({ ...adj, coins: e.target.value })} /></label>
                  <label className="field" style={{ width: 150 }}>Type<select value={adj.kind} onChange={(e) => setAdj({ ...adj, kind: e.target.value })}><option value="bonus">Bonus (+)</option><option value="adjust">Deduct (−)</option></select></label>
                  <label className="field" style={{ flex: 1, minWidth: 180 }}>Reason (worker sees it)<input required value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></label>
                  <button className="btn btn-sm">Save</button>
                </form>
              )}
              <table className="tbl" style={{ marginTop: 10 }}><tbody>
                {hist?.entries.map((e) => <tr key={e.id}><td className="small">{e.note || e.kind_label}<br /><span className="muted">{e.kind_label} · {fdatetime(e.created_at)}</span></td><td className="r"><span className={e.coins > 0 ? "plus" : "minus"}>{e.coins > 0 ? "+" : ""}{e.coins}</span></td></tr>)}
              </tbody></table>
              {hist && !hist.entries.length && <p className="muted small">No coins yet.</p>}
            </section>
          </div>
        </Modal>
      )}
    </>
  );
}
