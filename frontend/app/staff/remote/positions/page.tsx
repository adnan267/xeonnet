"use client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import RemoteTabs from "@/components/panel/RemoteTabs";
import { rs } from "@/components/panel/remote";
import { Flash, Modal, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";

type Pos = { id: number; title: string; slug: string; category: string; summary: string; description: string; requirements: string; is_open: boolean; sort: number; workers: number };
type Cfg = { signup_open: boolean; coin_value: string; min_withdraw_coins: number; payout_days: string };

export default function PositionsAndSettings() {
  useTitle("Positions & settings");
  const { can } = useMe();
  const [rows, reload] = useLoad<Pos[]>("staff/remote/positions");
  const [cfgData] = useLoad<Cfg>("staff/remote/settings");
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [edit, setEdit] = useState<Partial<Pos> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (cfgData) setCfg(cfgData); }, [cfgData]);
  const write = can("remote", true);
  const admin = can("settings", true);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(edit!.id ? `staff/remote/positions/${edit!.id}` : "staff/remote/positions", { method: edit!.id ? "PATCH" : "POST", body: edit });
      setEdit(null); reload(); setMsg({ ok: true, text: "Saved." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function saveCfg(e: React.FormEvent) {
    e.preventDefault();
    try { setCfg(await api<Cfg>("staff/remote/settings", { method: "PUT", body: cfg })); setMsg({ ok: true, text: "Settings saved." }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <RemoteTabs />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      {cfg && (
        <form onSubmit={saveCfg} className="panel stack" style={{ marginBottom: 20 }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Coins &amp; payments {!admin && <span className="muted small">(only an admin can change)</span>}</h3>
          <div className="form-grid">
            <label className="field">1 coin = Rs<input type="number" step="0.01" min="0.01" disabled={!admin} value={cfg.coin_value} onChange={(e) => setCfg({ ...cfg, coin_value: e.target.value })} />
              <small className="muted">1,000 coins = {rs(1000 * Number(cfg.coin_value || 0))}</small></label>
            <label className="field">Minimum withdrawal (coins)<input type="number" min={1} disabled={!admin} value={cfg.min_withdraw_coins} onChange={(e) => setCfg({ ...cfg, min_withdraw_coins: Number(e.target.value) })} />
              <small className="muted">= {rs(cfg.min_withdraw_coins * Number(cfg.coin_value || 0))}</small></label>
            <label className="field">We pay<input disabled={!admin} value={cfg.payout_days} onChange={(e) => setCfg({ ...cfg, payout_days: e.target.value })} /></label>
          </div>
          <label className="row" style={{ ["--gap" as string]: "8px" }}><input type="checkbox" disabled={!admin} checked={cfg.signup_open} onChange={(e) => setCfg({ ...cfg, signup_open: e.target.checked })} /> New people can join from the website</label>
          <p className="muted small" style={{ margin: 0 }}>Changing the coin value affects future withdrawals only; requests already made keep their amount.</p>
          {admin && <div><button className="btn btn-sm">Save settings</button></div>}
        </form>
      )}
      <div className="toolbar"><h3 className="panel-title" style={{ margin: 0 }}>Positions on the Careers page</h3>
        {write && <button className="btn btn-sm" onClick={() => setEdit({ title: "", category: "", summary: "", description: "", requirements: "", is_open: true, sort: (rows?.length ?? 0) })}><Plus /> New position</button>}</div>
      <div className="table-wrap"><table className="tbl">
        <thead><tr><th>Position</th><th>Workers</th><th>Status</th><th></th></tr></thead>
        <tbody>{rows?.map((p) => (
          <tr key={p.id}>
            <td><b>{p.title}</b><br /><span className="muted small">{p.category}{p.summary ? ` · ${p.summary}` : ""}</span></td>
            <td>{p.workers}</td>
            <td>{p.is_open ? <Status s="active" label="open" /> : <Status s="cancelled" label="closed" />}</td>
            <td>{write && <button className="link small" onClick={() => setEdit(p)}>Edit</button>}</td>
          </tr>
        ))}</tbody>
      </table></div>
      {edit && (
        <Modal title={edit.id ? "Edit position" : "New position"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="stack">
            <div className="form-grid">
              <label className="field">Title *<input required value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
              <label className="field">Category<input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} placeholder="Writing, Design…" /></label>
            </div>
            <label className="field">Short description<input maxLength={240} value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} /></label>
            <label className="field">Requirements <small>(one per line)</small><textarea rows={4} value={edit.requirements} onChange={(e) => setEdit({ ...edit, requirements: e.target.value })} /></label>
            <div className="form-grid">
              <label className="field">Order<input type="number" value={edit.sort ?? 0} onChange={(e) => setEdit({ ...edit, sort: Number(e.target.value) })} /></label>
              <label className="row" style={{ ["--gap" as string]: "8px", alignSelf: "end" }}><input type="checkbox" checked={!!edit.is_open} onChange={(e) => setEdit({ ...edit, is_open: e.target.checked })} /> Open for applications</label>
            </div>
            <div className="row"><button className="btn">Save</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
