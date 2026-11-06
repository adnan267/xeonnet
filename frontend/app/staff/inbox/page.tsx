"use client";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Empty, useLoad } from "@/components/panel/ui";
import { Stars } from "@/components/bits";
import { api } from "@/lib/api";
import { fdatetime, waLink } from "@/lib/format";

type M = { id: number; name: string; email: string; phone: string; service: string; budget: string; message: string; is_read: boolean; created_at: string };
type R = { id: number; name: string; role: string; rating: number; text: string; approved: boolean; created_at: string };
type S = { id: number; email: string; created_at: string };

export default function Inbox() {
  useTitle("Inbox & reviews");
  const [tab, setTab] = useState<"messages" | "reviews" | "subscribers">("messages");
  const [unread, setUnread] = useState(false);
  const [msgs, reloadM] = useLoad<M[]>(`staff/messages${unread ? "?show=unread" : ""}`, [unread]);
  const [revs, reloadR] = useLoad<R[]>("staff/reviews");
  const [subs] = useLoad<S[]>("staff/subscribers");
  const patch = async (path: string, body: unknown, after: () => void) => { await api(path, { method: "PATCH", body }); after(); };
  const del = async (path: string, after: () => void) => { if (confirm("Delete?")) { await api(path, { method: "DELETE" }); after(); } };

  return (
    <>
      <div className="toolbar">
        <div className="row">
          {(["messages", "reviews", "subscribers"] as const).map((t) => <button key={t} className={`btn btn-sm ${tab === t ? "" : "btn-ghost"}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>
        {tab === "messages" && <label className="check"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} /> Unread only</label>}
      </div>
      {tab === "messages" && (msgs && !msgs.length ? <Empty>No messages.</Empty> : (
        <div className="stack">{msgs?.map((m) => (
          <article key={m.id} className="panel stack" style={{ ["--gap" as string]: "8px", borderColor: m.is_read ? undefined : "var(--brand)" }}>
            <div className="row between"><b>{m.name}</b><span className="muted small">{fdatetime(m.created_at)}</span></div>
            <p className="small muted"><a href={`mailto:${m.email}`} className="link">{m.email}</a>{m.phone && <> · <a className="link" href={waLink(m.phone, `Hello ${m.name}, thank you for contacting Xeon Net.`)} target="_blank" rel="noopener">{m.phone}</a></>}{m.service && ` · ${m.service}`}{m.budget && ` · ${m.budget}`}</p>
            <p style={{ whiteSpace: "pre-line" }}>{m.message}</p>
            <div className="row"><button className="link small" onClick={() => patch(`staff/messages/${m.id}`, { is_read: !m.is_read }, reloadM)}>Mark as {m.is_read ? "unread" : "read"}</button><button className="link danger small" onClick={() => del(`staff/messages/${m.id}`, reloadM)}>Delete</button></div>
          </article>
        ))}</div>
      ))}
      {tab === "reviews" && (revs && !revs.length ? <Empty>No reviews yet.</Empty> : (
        <div className="stack">{revs?.map((r) => (
          <article key={r.id} className="panel stack" style={{ ["--gap" as string]: "8px" }}>
            <div className="row between"><span><b>{r.name}</b>{r.role && <span className="muted"> · {r.role}</span>} <Stars n={r.rating} /></span><span className={`pill ${r.approved ? "st-ok" : "st-partial"}`}>{r.approved ? "Live" : "Pending"}</span></div>
            <p>{r.text}</p>
            <div className="row"><button className="link small" onClick={() => patch(`staff/reviews/${r.id}`, { approved: !r.approved }, reloadR)}>{r.approved ? "Hide" : "Approve"}</button><button className="link danger small" onClick={() => del(`staff/reviews/${r.id}`, reloadR)}>Delete</button></div>
          </article>
        ))}</div>
      ))}
      {tab === "subscribers" && (subs && !subs.length ? <Empty>No subscribers yet.</Empty> : (
        <div className="table-wrap"><table className="tbl"><thead><tr><th>Email</th><th>Joined</th></tr></thead>
          <tbody>{subs?.map((s) => <tr key={s.id}><td>{s.email}</td><td>{fdatetime(s.created_at)}</td></tr>)}</tbody></table></div>
      ))}
    </>
  );
}
