"use client";
import { Copy, Plus } from "lucide-react";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Flash, Modal, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdatetime } from "@/lib/format";

type U = { id: number; email: string; first_name: string; last_name: string; name: string; role: string; phone: string; job_title: string; is_active: boolean; last_login: string | null; password?: string };
const ROLES = [["admin", "Admin — everything"], ["sales", "Sales — clients, proposals, invoices, projects"], ["accounts", "Accounts — payments and billing"], ["hr", "HR — certificates and team list"], ["staff", "Team member — own projects and tasks"]];

export default function Team() {
  useTitle("Team");
  const { can, me } = useMe();
  const [rows, reload] = useLoad<U[]>("staff/team");
  const [edit, setEdit] = useState<Partial<U> | null>(null);
  const [link, setLink] = useState<{ name: string; link: string; emailed: boolean } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("team", true);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const u = await api<U>(edit!.id ? `staff/team/${edit!.id}` : "staff/team", { method: edit!.id ? "PATCH" : "POST", body: edit });
      const isNew = !edit!.id;
      setEdit(null); reload();
      if (isNew && !edit!.password) setLink({ name: u.name, ...(await api<{ link: string; emailed: boolean }>(`staff/team/${u.id}/invite`, { body: {} })) });
      else setMsg({ ok: true, text: "Saved." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function invite(u: U) { setLink({ name: u.name, ...(await api<{ link: string; emailed: boolean }>(`staff/team/${u.id}/invite`, { body: {} })) }); }
  async function deactivate(u: U) { if (confirm(`Deactivate ${u.name}? They will not be able to log in.`)) { await api(`staff/team/${u.id}`, { method: "DELETE" }).catch((e) => setMsg({ ok: false, text: e.message })); reload(); } }

  return (
    <>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar"><p className="muted small">People who work with you. Each role only sees its own part of the panel.</p>{write && <button className="btn btn-sm" onClick={() => setEdit({ role: "staff", is_active: true })}><Plus /> Add person</button>}</div>
      <div className="table-wrap"><table className="tbl">
        <thead><tr><th>Name</th><th>Role</th><th>Contact</th><th>Last login</th><th></th></tr></thead>
        <tbody>{rows?.map((u) => (
          <tr key={u.id} style={{ opacity: u.is_active ? 1 : .5 }}>
            <td><b>{u.name}</b>{u.job_title && <><br /><span className="muted small">{u.job_title}</span></>}</td>
            <td><span className="pill">{u.role}</span>{!u.is_active && <> <span className="pill st-revoked">inactive</span></>}</td>
            <td>{u.email}<br /><span className="muted small">{u.phone}</span></td>
            <td className="small">{fdatetime(u.last_login) || "Never"}</td>
            <td>{write && <div className="row" style={{ ["--gap" as string]: "6px 14px" }}>
              <button className="link small" onClick={() => setEdit({ ...u, password: "" })}>Edit</button>
              <button className="link small" onClick={() => invite(u)}>Password link</button>
              {u.id !== me.id && u.is_active && <button className="link danger small" onClick={() => deactivate(u)}>Deactivate</button>}
            </div>}</td>
          </tr>
        ))}</tbody>
      </table></div>
      {edit && (
        <Modal title={edit.id ? "Edit person" : "Add person"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="stack">
            <div className="form-grid">
              <label className="field">First name<input required value={edit.first_name || ""} onChange={(e) => setEdit({ ...edit, first_name: e.target.value })} /></label>
              <label className="field">Last name<input value={edit.last_name || ""} onChange={(e) => setEdit({ ...edit, last_name: e.target.value })} /></label>
              <label className="field">Email (login) *<input type="email" required value={edit.email || ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
              <label className="field">Phone<input value={edit.phone || ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
              <label className="field">Job title<input value={edit.job_title || ""} placeholder="e.g. Web Developer" onChange={(e) => setEdit({ ...edit, job_title: e.target.value })} /></label>
            </div>
            <label className="field">Role<select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field">Password <small>(optional — leave empty to send them a set-password link)</small><input type="password" minLength={8} autoComplete="new-password" value={edit.password || ""} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></label>
            {edit.id && <label className="check"><input type="checkbox" checked={!!edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Active (can log in)</label>}
            <div className="row"><button className="btn">Save</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
      {link && (
        <Modal title={`Password link for ${link.name}`} onClose={() => setLink(null)}>
          <div className="stack">
            <p className={`alert ${link.emailed ? "alert-ok" : "alert-info"}`}>{link.emailed ? "We emailed this link to them." : "Email is not set up yet — share the link yourself (e.g. WhatsApp)."}</p>
            <input readOnly value={link.link} onFocus={(e) => e.target.select()} />
            <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(link.link)}><Copy /> Copy link</button>
            <p className="muted small">Valid for 3 days.</p>
          </div>
        </Modal>
      )}
    </>
  );
}
