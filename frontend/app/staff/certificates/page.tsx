"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Empty, Flash, Modal, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdate, today } from "@/lib/format";

type Cred = { id: number; code: string; holder_name: string; doc_type: string; title: string; duration: string; start_date: string | null; end_date: string | null; period: string; issued_on: string; status: string; note: string };

export default function Certificates() {
  useTitle("Certificates & documents");
  const { can } = useMe();
  const [q, setQ] = useState("");
  const [rows, reload] = useLoad<Cred[]>(`staff/certificates?q=${encodeURIComponent(q)}`, [q]);
  const [types] = useLoad<string[]>("staff/certificates/types");
  const [edit, setEdit] = useState<Partial<Cred> | null>(null);
  const [show, setShow] = useState<Cred | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const write = can("certificates", true);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const c = await api<Cred>(edit!.id ? `staff/certificates/${edit!.id}` : "staff/certificates", { method: edit!.id ? "PATCH" : "POST", body: edit });
      setEdit(null); reload();
      if (!edit!.id) setShow(c); else setMsg({ ok: true, text: "Saved." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function toggle(c: Cred) { await api(`staff/certificates/${c.id}/toggle`, { body: {} }); reload(); }
  async function del(c: Cred) { if (confirm("Delete permanently?")) { await api(`staff/certificates/${c.id}`, { method: "DELETE" }); reload(); } }

  return (
    <>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar">
        <div className="filters"><input type="search" placeholder="Search name or code…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="row"><a className="btn btn-ghost btn-sm" href="/verify" target="_blank">Public verify page</a>{write && <><button className="btn btn-ghost btn-sm" onClick={() => setEdit({ doc_type: types?.[0], issued_on: today() })}><Plus /> Other document</button><Link className="btn btn-sm" href="/staff/certificates/new"><Plus /> New internship certificate</Link></>}</div>
      </div>
      {rows && !rows.length ? <Empty>Nothing issued yet.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Code</th><th>Person</th><th>Document</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows?.map((c) => (
            <tr key={c.id}>
              <td><code>{c.code}</code></td>
              <td><b>{c.holder_name}</b><br /><span className="muted small">{fdate(c.issued_on)}</span></td>
              <td>{c.doc_type}{(c.title || c.duration) && <><br /><span className="muted small">{[c.title, c.duration].filter(Boolean).join(" · ")}</span></>}</td>
              <td><Status s={c.status} /></td>
              <td><div className="row" style={{ ["--gap" as string]: "6px 14px" }}>
                <a className="link small" href={`/staff/certificates/${c.id}/print`} target="_blank">Print PDF</a>
                <button className="link small" onClick={() => setShow(c)}>QR &amp; link</button>
                {write && <><button className="link small" onClick={() => setEdit(c)}>Edit</button><button className="link small" onClick={() => toggle(c)}>{c.status === "valid" ? "Revoke" : "Restore"}</button><button className="link danger small" onClick={() => del(c)}>Delete</button></>}
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {edit && (
        <Modal title={edit.id ? "Edit document" : "Issue certificate / document"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="stack">
            <label className="field">Name of person *<input required value={edit.holder_name || ""} onChange={(e) => setEdit({ ...edit, holder_name: e.target.value })} /></label>
            <label className="field">Document type<select value={edit.doc_type} onChange={(e) => setEdit({ ...edit, doc_type: e.target.value })}>{types?.map((t) => <option key={t}>{t}</option>)}</select></label>
            <div className="form-grid">
              <label className="field">{edit.doc_type?.startsWith("Internship") ? "Internship field" : "Program / role"}<input value={edit.title || ""} placeholder="Full Stack Web Development" onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
              <label className="field">Duration <small>(empty = from dates)</small><input value={edit.duration || ""} placeholder="3 Months" onChange={(e) => setEdit({ ...edit, duration: e.target.value })} /></label>
              <label className="field">Start date<input type="date" value={edit.start_date || ""} onChange={(e) => setEdit({ ...edit, start_date: e.target.value || null, period: "" })} /></label>
              <label className="field">End date<input type="date" value={edit.end_date || ""} onChange={(e) => setEdit({ ...edit, end_date: e.target.value || null, period: "" })} /></label>
              <label className="field">Date of issue<input type="date" value={edit.issued_on || ""} onChange={(e) => setEdit({ ...edit, issued_on: e.target.value })} /></label>
            </div>
            <label className="field">Remarks <small>(shown publicly)</small><input value={edit.note || ""} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></label>
            <p className="muted small">Only these details are public. A unique number (like XN-INT-2026-0101) is created automatically and cannot be changed or repeated.</p>
            <div className="row"><button className="btn">{edit.id ? "Save" : "Issue & create code"}</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
      {show && (
        <Modal title={show.holder_name} onClose={() => setShow(null)}>
          <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
            <img src={`/api/public/qr/${show.code}.svg`} alt={`QR code for ${show.code}`} width={220} height={220} style={{ background: "#fff", borderRadius: 12 }} />
            <code style={{ fontSize: 18 }}>{show.code}</code>
            <p className="muted small">Print the code and QR on the certificate. Scanning opens:<br />{origin}/verify/{show.code}</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <a className="btn btn-sm" href={`/api/public/qr/${show.code}.svg`} download={`${show.code}.svg`}>Download QR</a>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(`${origin}/verify/${show.code}`)}>Copy link</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
