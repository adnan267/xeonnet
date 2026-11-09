"use client";
import { Award, CheckCircle2, Circle, ExternalLink, Lock, Upload } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Flash, Progress, Status, useLoad } from "@/components/panel/ui";
import { groupLessons, KindIcon, rs, ST, Video } from "@/components/learn/shared";
import type { StudentCourse } from "@/components/learn/types";
import { api } from "@/lib/api";
import { fdate, fdatetime } from "@/lib/format";

/** Shrinks a screenshot so it uploads quickly (max 1400 px, JPEG). */
function readProof(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height)), cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src); resolve(cv.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("That file is not an image."));
    img.src = URL.createObjectURL(file);
  });
}

function PaySection({ data, reload }: { data: StudentCourse; reload: () => void }) {
  const e = data.enrollment;
  const [f, setF] = useState({ method: "jazzcash", reference: "", payer_name: "", proof: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pending = data.payments.find((p) => p.status === "pending");
  const lastRejected = data.payments.find((p) => p.status === "rejected");

  async function send(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true); setErr("");
    try { await api(`learn/courses/${e.id}/pay`, { body: f }); reload(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }

  if (pending) return <div className="alert">We received your payment details ({pending.method_label}, {rs(pending.amount)}{pending.reference ? `, ID ${pending.reference}` : ""}) on {fdatetime(pending.created_at)}. The course opens as soon as we confirm it.</div>;
  return (
    <section className="panel stack">
      <h3 className="panel-title" style={{ margin: 0 }}>Pay the course fee: {rs(e.fee)}</h3>
      {lastRejected && <p className="alert alert-err" style={{ margin: 0 }}>Your last payment could not be confirmed: {lastRejected.staff_note}</p>}
      <div className="card card-pad small" style={{ padding: 16 }}>
        <b>How to pay</b>
        {data.payment.instructions ? <p className="pre" style={{ margin: "6px 0 0" }}>{data.payment.instructions}</p> : null}
        {data.payment.bank.length > 0 && <p style={{ margin: "6px 0 0" }}>{data.payment.bank.map((b) => <span key={b.label}>{b.label}: <b>{b.value}</b><br /></span>)}</p>}
        {!data.payment.instructions && !data.payment.bank.length && <p style={{ margin: "6px 0 0" }}>Message us on WhatsApp at 0300 6666 190 for the payment details.</p>}
        <p className="muted" style={{ margin: "6px 0 0" }}>After paying, send the transaction ID and a screenshot below.</p>
      </div>
      <form onSubmit={send} className="stack">
        <div className="form-grid">
          <label className="field">Paid by<select value={f.method} onChange={(x) => setF({ ...f, method: x.target.value })}><option value="jazzcash">JazzCash</option><option value="easypaisa">Easypaisa</option><option value="bank">Bank transfer</option></select></label>
          <label className="field">Transaction ID<input value={f.reference} onChange={(x) => setF({ ...f, reference: x.target.value })} /></label>
          <label className="field">Name on the account<input value={f.payer_name} onChange={(x) => setF({ ...f, payer_name: x.target.value })} /></label>
          <label className="field">Screenshot<input type="file" accept="image/*" onChange={async (x) => { const file = x.target.files?.[0]; if (file) try { setF({ ...f, proof: await readProof(file) }); } catch (y) { setErr((y as Error).message); } }} /></label>
        </div>
        {f.proof && /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.proof} alt="Payment screenshot" style={{ maxHeight: 180, borderRadius: 10, alignSelf: "flex-start" }} />}
        {err && <p className="note err">{err}</p>}
        <div><button className="btn" disabled={busy || (!f.reference.trim() && !f.proof)}><Upload /> {busy ? "Sending…" : "Send payment details"}</button></div>
      </form>
    </section>
  );
}

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const [d, reload, err, setD] = useLoad<StudentCourse>(`learn/courses/${id}`);
  useTitle(d?.course.title ?? "Course");
  const [current, setCurrent] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!d) return <p className="muted">Loading…</p>;
  const e = d.enrollment, open = e.status === "active" || e.status === "completed";
  const lesson = d.lessons.find((l) => l.id === current) ?? d.lessons.find((l) => !d.done.includes(l.id)) ?? d.lessons[0];
  const isDone = lesson ? d.done.includes(lesson.id) : false;
  const idx = lesson ? d.lessons.indexOf(lesson) : -1;

  async function mark(done: boolean) {
    try {
      const r = await api<{ done: number[]; test: StudentCourse["test"] }>(`learn/courses/${id}/lessons/${lesson!.id}`, { body: { done } });
      setD({ ...d!, done: r.done, test: r.test, enrollment: { ...e, progress: Math.round((r.done.length * 100) / Math.max(1, d!.course.lessons)) } });
      if (done && idx < d!.lessons.length - 1) setCurrent(d!.lessons[idx + 1].id);
    } catch (x) { setMsg({ ok: false, text: (x as Error).message }); }
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "20px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="row between">
        <div><Status s={ST[e.status]} label={e.status_label.toLowerCase()} /> <span className="muted small">Enrolled {fdate(e.created_at)}</span></div>
        {open && <div style={{ minWidth: 220 }}><Progress value={e.progress} /><span className="muted small">{d.done.length} of {d.course.lessons} lessons done</span></div>}
      </div>
      {d.certificate && (
        <div className="alert alert-ok row between"><span><Award size={16} /> You passed! Certificate <b>{d.certificate.code}</b></span>
          <Link className="btn btn-sm" href={`/learn/certificates/${d.certificate.code}`}>View &amp; download</Link></div>
      )}
      {(e.status === "unpaid" || e.status === "review") && <PaySection data={d} reload={reload} />}

      <div className="player">
        <aside className="panel syllabus" style={{ padding: 14 }}>
          {groupLessons(d.course.syllabus).map((g, i) => (
            <div key={i}>
              {g.section && <h4>{g.section}</h4>}
              {g.items.map((l) => {
                const available = d.lessons.some((x) => x.id === l.id);
                const done = d.done.includes(l.id);
                return available ? (
                  <button key={l.id} className={`lesson-row ${lesson?.id === l.id ? "on" : ""}`} onClick={() => setCurrent(l.id)}>
                    {done ? <CheckCircle2 size={16} className="done" /> : <Circle size={16} className="muted" />}<span className="grow">{l.title}</span><KindIcon k={l.kind} />
                  </button>
                ) : <div key={l.id} className="lesson-row muted"><Lock size={15} /><span className="grow">{l.title}</span></div>;
              })}
            </div>
          ))}
          <h4>Final test</h4>
          <Link href={`/learn/course/${id}/test`} className={`lesson-row ${d.test.can_start ? "" : "muted"}`}><Award size={16} /><span className="grow">Test &amp; certificate</span></Link>
        </aside>

        <div className="stack" style={{ ["--gap" as string]: "16px" }}>
          {lesson ? (
            <section className="panel stack">
              {lesson.section && <span className="eyebrow">{lesson.section}</span>}
              <h2 className="h3" style={{ margin: 0 }}>{lesson.title}</h2>
              {lesson.video_url && <Video url={lesson.video_url} title={lesson.title} />}
              {lesson.body && <div className="pre">{lesson.body}</div>}
              {lesson.file_url && <a className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} href={lesson.file_url} target="_blank" rel="noopener noreferrer">{lesson.file_label || "Open notes / files"} <ExternalLink /></a>}
              {open && (
                <div className="row between" style={{ marginTop: 8 }}>
                  <button className="btn btn-ghost btn-sm" disabled={idx <= 0} onClick={() => setCurrent(d.lessons[idx - 1].id)}>← Previous</button>
                  {isDone ? <button className="link small" onClick={() => mark(false)}>Mark as not done</button>
                    : <button className="btn btn-sm" onClick={() => mark(true)}><CheckCircle2 /> Mark as done{idx < d.lessons.length - 1 ? " & next" : ""}</button>}
                </div>
              )}
              {!open && <p className="muted small" style={{ margin: 0 }}>This is a free preview. Pay the fee to open all lessons.</p>}
            </section>
          ) : <p className="muted">No lessons yet.</p>}

          {open && (
            <section className="panel stack">
              <h3 className="panel-title" style={{ margin: 0 }}>Final test</h3>
              <p className="small" style={{ margin: 0 }}>{d.test.questions} questions · pass mark {d.test.pass_mark}% · tries used {d.test.attempts_used} of {d.test.attempts_allowed}{d.test.time_limit ? ` · ${d.test.time_limit} minutes` : ""}</p>
              {d.attempts.length > 0 && <p className="muted small" style={{ margin: 0 }}>Your scores: {d.attempts.map((a) => `${a.score}%${a.passed ? " (passed)" : ""}`).join(", ")}</p>}
              {d.test.can_start ? <Link className="btn" style={{ alignSelf: "flex-start" }} href={`/learn/course/${id}/test`}>Start the test</Link> : <p className="note" style={{ margin: 0 }}>{d.test.reason}</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
