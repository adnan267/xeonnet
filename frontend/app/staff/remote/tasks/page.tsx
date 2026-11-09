"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import RemoteTabs from "@/components/panel/RemoteTabs";
import { Coins, KIND_LABEL } from "@/components/panel/remote";
import { Empty, Flash, Modal, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdatetime } from "@/lib/format";

type Task = { id: number; title: string; kind: string; position: number | null; position_title: string; instructions: string; resource_url: string; proof: string; coins: number; slots: number | null; deadline: string | null; is_active: boolean; taken: number; pending: number; approved: number };
type Pos = { id: number; title: string };
const blank: Partial<Task> = { title: "", kind: "work", position: null, instructions: "", resource_url: "", proof: "", coins: 100, slots: null, deadline: null, is_active: true };

/** ISO time → value for <input type="datetime-local"> in the viewer's own time zone */
const toLocal = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function RemoteTasksAdmin() {
  useTitle("Remote tasks");
  const { can } = useMe();
  const [show, setShow] = useState("active");
  const [rows, reload, err] = useLoad<Task[]>(`staff/remote/tasks?show=${show}`, [show]);
  const [positions] = useLoad<Pos[]>("staff/remote/positions");
  const [edit, setEdit] = useState<Partial<Task> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("remote", true);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = { ...edit, slots: edit!.slots || null, deadline: edit!.deadline || null, resource_url: edit!.resource_url || "" };
      await api(edit!.id ? `staff/remote/tasks/${edit!.id}` : "staff/remote/tasks", { method: edit!.id ? "PATCH" : "POST", body });
      setMsg({ ok: true, text: edit!.id ? "Task saved." : "Task published. Workers who can do it get a notification." });
      setEdit(null); reload();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function toggle(t: Task) { await api(`staff/remote/tasks/${t.id}`, { method: "PATCH", body: { is_active: !t.is_active } }); reload(); }
  async function del(t: Task) {
    if (!confirm("Delete this task?")) return;
    const r = await api<{ detail?: string } | undefined>(`staff/remote/tasks/${t.id}`, { method: "DELETE" });
    if (r?.detail) setMsg({ ok: true, text: r.detail });
    reload();
  }

  return (
    <>
      <RemoteTabs />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar">
        <div className="filters"><select value={show} onChange={(e) => setShow(e.target.value)}><option value="active">Open tasks</option><option value="closed">Closed</option><option value="all">All</option></select></div>
        {write && <button className="btn btn-sm" onClick={() => setEdit({ ...blank })}><Plus /> New task</button>}
      </div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>No tasks yet. Create one: workers see it straight away.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Task</th><th>For</th><th className="r">Coins</th><th>Progress</th><th></th></tr></thead>
          <tbody>{rows?.map((t) => (
            <tr key={t.id}>
              <td><b>{t.title}</b><br /><span className="muted small">{KIND_LABEL[t.kind]}{t.deadline ? ` · due ${fdatetime(t.deadline)}` : ""}</span></td>
              <td className="small">{t.position_title || "Everyone"}</td>
              <td className="r"><Coins n={t.coins} /></td>
              <td className="small">{t.approved} approved · {t.pending} waiting{t.slots != null ? ` · ${t.slots - t.taken} of ${t.slots} places left` : ""}<br />{!t.is_active && <Status s="cancelled" label="closed" />}</td>
              <td>{write && <div className="row" style={{ ["--gap" as string]: "6px 14px" }}>
                <button className="link small" onClick={() => setEdit(t)}>Edit</button>
                <button className="link small" onClick={() => toggle(t)}>{t.is_active ? "Close" : "Reopen"}</button>
                <button className="link danger small" onClick={() => del(t)}>Delete</button>
              </div>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {edit && (
        <Modal title={edit.id ? "Edit task" : "New task"} onClose={() => setEdit(null)} wide>
          <form onSubmit={save} className="stack">
            <label className="field">Title *<input required value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="e.g. Write 3 product descriptions" /></label>
            <div className="form-grid">
              <label className="field">Type<select value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label className="field">Who can do it<select value={edit.position ?? ""} onChange={(e) => setEdit({ ...edit, position: e.target.value ? Number(e.target.value) : null })}><option value="">Everyone</option>{positions?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
              <label className="field">Coins *<input type="number" min={1} required value={edit.coins ?? ""} onChange={(e) => setEdit({ ...edit, coins: Number(e.target.value) })} /></label>
              <label className="field">Places <small>(empty = no limit)</small><input type="number" min={1} value={edit.slots ?? ""} onChange={(e) => setEdit({ ...edit, slots: e.target.value ? Number(e.target.value) : null })} /></label>
              <label className="field">Deadline <small>(optional)</small><input type="datetime-local" value={toLocal(edit.deadline)} onChange={(e) => setEdit({ ...edit, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label>
              <label className="field">Brief / files link<input type="url" value={edit.resource_url} onChange={(e) => setEdit({ ...edit, resource_url: e.target.value })} placeholder="https://" /></label>
            </div>
            <label className="field">Instructions *<textarea required rows={7} value={edit.instructions} onChange={(e) => setEdit({ ...edit, instructions: e.target.value })} placeholder="Explain exactly what to do and the quality you expect." /></label>
            <label className="field">What to send back<input value={edit.proof} onChange={(e) => setEdit({ ...edit, proof: e.target.value })} placeholder="e.g. Google Doc link with view access" /></label>
            <label className="row" style={{ ["--gap" as string]: "8px" }}><input type="checkbox" checked={!!edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Open for workers</label>
            <div className="row"><button className="btn">{edit.id ? "Save" : "Publish task"}</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
