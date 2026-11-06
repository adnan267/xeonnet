"use client";
import { Copy, KeyRound, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import ClientForm, { blankClient as blank, type C } from "@/components/panel/ClientForm";
import { Empty, Flash, Modal, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { waLink } from "@/lib/format";


export default function Clients() {
  useTitle("Clients");
  const { can } = useMe();
  const [q, setQ] = useState("");
  const [rows, reload] = useLoad<C[]>(`staff/clients?q=${encodeURIComponent(q)}`, [q]);
  const [edit, setEdit] = useState<typeof blank | null>(null);
  const [invite, setInvite] = useState<{ client: C; link: string; sent: { channel: string; status: string; error: string }[] } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("clients", true);

  async function sendInvite(c: C) {
    try { setInvite({ client: c, ...(await api<{ link: string; sent: { channel: string; status: string; error: string }[] }>(`staff/clients/${c.id}/invite`, { body: {} })) }); reload(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function remove(c: C) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try { await api(`staff/clients/${c.id}`, { method: "DELETE" }); reload(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar">
        <div className="filters"><input type="search" placeholder="Search name, company, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {write && <button className="btn btn-sm" onClick={() => setEdit({ ...blank })}><Plus /> Add client</button>}
      </div>
      {rows && !rows.length ? <Empty>No clients yet.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Client</th><th>Contact</th><th>Docs</th><th>Portal</th><th></th></tr></thead>
          <tbody>{rows?.map((c) => (
            <tr key={c.id}>
              <td><b>{c.name}</b>{c.company && <><br /><span className="muted small">{c.company}</span></>}<br /><span className="tag">{c.country}</span></td>
              <td>{c.phone}<br /><span className="muted small">{c.email}</span></td>
              <td>{c.doc_count}</td>
              <td>{c.has_portal ? <span className="pill st-ok">active</span> : <span className="pill">none</span>}</td>
              <td><div className="row" style={{ ["--gap" as string]: "6px 14px" }}>
                {can("documents", true) && <><Link className="link small" href={`/staff/documents/new?type=proposal&client=${c.id}`}>Proposal</Link><Link className="link small" href={`/staff/documents/new?type=invoice&client=${c.id}`}>Invoice</Link></>}
                {write && <><button className="link small" onClick={() => sendInvite(c)}>{c.has_portal ? "Resend login" : "Give portal login"}</button>
                  <button className="link small" onClick={() => setEdit({ ...c })}>Edit</button>
                  <button className="link danger small" onClick={() => remove(c)}>Delete</button></>}
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {edit && <ClientForm initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); setMsg({ ok: true, text: "Client saved." }); }} />}
      {invite && (
        <Modal title="Client portal login" onClose={() => setInvite(null)}>
          <div className="stack">
            <p>{invite.client.name} can now set a password and log in at <b>/login</b>.</p>
            {invite.sent.map((s) => <p key={s.channel} className={`alert ${s.status === "sent" ? "alert-ok" : "alert-err"}`}>{s.channel.toUpperCase()}: {s.status}{s.error && ` — ${s.error}`}</p>)}
            {!invite.sent.length && <p className="alert alert-info">No email/SMS was sent (check the client&apos;s email or Settings). Share the link yourself:</p>}
            <input readOnly value={invite.link} onFocus={(e) => e.target.select()} />
            <div className="row">
              <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(invite.link)}><Copy /> Copy link</button>
              {invite.client.phone && <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener" href={waLink(invite.client.phone, `Hello ${invite.client.name}, here is your Xeon Net client portal link to set your password: ${invite.link}`)}><MessageCircle /> WhatsApp</a>}
            </div>
            <p className="muted small"><KeyRound size={14} /> The link works for 3 days.</p>
          </div>
        </Modal>
      )}
    </>
  );
}
