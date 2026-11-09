"use client";
import { ExternalLink, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Coins, KIND_LABEL, SubStatus, type RSub, type RTask } from "@/components/panel/remote";
import { Flash, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdatetime } from "@/lib/format";

type Detail = RTask & { my_submissions: RSub[]; open: boolean };

export default function RemoteTask() {
  const { id } = useParams<{ id: string }>();
  const [t, reload, err] = useLoad<Detail>(`remote/tasks/${id}`);
  useTitle(t?.title ?? "Task");
  const [f, setF] = useState({ text: "", link: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`remote/tasks/${id}`, { body: f });
      setF({ text: "", link: "" }); reload();
      setMsg({ ok: true, text: "Sent! We will review it and add the coins when it is approved." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  }

  if (err) return <p className="alert alert-err">{err} <Link className="link" href="/remote/tasks">Back to tasks</Link></p>;
  if (!t) return <p className="muted">Loading…</p>;
  const lastRejected = t.my_submissions.find((x) => x.status === "rejected");
  return (
    <div className="stack" style={{ maxWidth: 860, ["--gap" as string]: "20px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <section className="panel stack">
        <div className="row between"><span className="pill">{KIND_LABEL[t.kind] || t.kind}{t.position_title ? ` · ${t.position_title}` : ""}</span><Coins n={t.coins} /></div>
        <h2 className="h3" style={{ margin: 0 }}>{t.title}</h2>
        <p className="muted small" style={{ margin: 0 }}>{t.deadline ? `Deadline: ${fdatetime(t.deadline)}` : "No deadline"}{t.places_left != null ? ` · ${t.places_left} place${t.places_left === 1 ? "" : "s"} left` : ""}</p>
        <div className="pre">{t.instructions}</div>
        {t.resource_url && <a className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} href={t.resource_url} target="_blank" rel="noopener">Open brief / files <ExternalLink /></a>}
        {t.proof && <p className="small"><b>What to send:</b> {t.proof}</p>}
      </section>

      {t.my_submissions.length > 0 && (
        <section className="panel stack">
          <h3 className="panel-title" style={{ margin: 0 }}>Your submissions</h3>
          {t.my_submissions.map((x) => (
            <div key={x.id} className="card card-pad stack" style={{ ["--gap" as string]: "8px" }}>
              <div className="row between"><span className="muted small">{fdatetime(x.created_at)}</span><SubStatus s={x.status} /></div>
              {x.text && <div className="pre small">{x.text}</div>}
              {x.link && <a className="link small" href={x.link} target="_blank" rel="noopener">{x.link}</a>}
              {x.status === "approved" && <p className="plus small" style={{ margin: 0 }}>+{x.coins} coins added to your wallet</p>}
              {x.review_note && <p className="small" style={{ margin: 0 }}><b>Note from Xeon Net:</b> {x.review_note}</p>}
            </div>
          ))}
        </section>
      )}

      {t.open ? (
        <form onSubmit={send} className="panel stack">
          <h3 className="panel-title" style={{ margin: 0 }}>{lastRejected ? "Send it again" : "Send your work"}</h3>
          <label className="field">Link to your work <small>(Google Drive, Docs, Canva, YouTube…)</small><input type="url" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" /></label>
          <label className="field">Notes / your work<textarea rows={6} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Paste your text here or explain what you did" /></label>
          <p className="muted small" style={{ margin: 0 }}>Make sure the link is set to “anyone with the link can view”.</p>
          <div><button className="btn" disabled={busy || (!f.text.trim() && !f.link.trim())}><Send /> {busy ? "Sending…" : "Send for review"}</button></div>
        </form>
      ) : t.my_submissions.some((x) => x.status !== "rejected") ? null : <p className="alert">This task is closed or all places are taken.</p>}
    </div>
  );
}
