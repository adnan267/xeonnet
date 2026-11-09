"use client";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import LearnTabs from "@/components/panel/LearnTabs";
import { Empty, Flash, Modal, Progress, Status, useLoad } from "@/components/panel/ui";
import { rs, ST } from "@/components/learn/shared";
import type { AttemptRow, Enrollment } from "@/components/learn/types";
import { api } from "@/lib/api";
import { fdate, fdatetime, waLink } from "@/lib/format";

type Row = Enrollment & { student_name: string; student_email: string; student_phone: string; course_title: string; extra_attempts: number; staff_note: string };
type Course = { id: number; title: string };

export default function Students() {
  useTitle("Students");
  const { can } = useMe();
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, reload, err] = useLoad<Row[]>(`staff/learn/enrollments?q=${encodeURIComponent(q)}&course=${course}&status=${status}`, [q, course, status]);
  const [courses] = useLoad<Course[]>("staff/learn/courses");
  const [open, setOpen] = useState<Row | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function show(r: Row) { setOpen(r); setAttempts(null); setAttempts(await api(`staff/learn/enrollments/${r.id}/attempts`)); }
  async function update(body: Partial<Row>, text = "Saved.") {
    try { const r = await api<Row>(`staff/learn/enrollments/${open!.id}`, { method: "PATCH", body }); setOpen(r); reload(); setMsg({ ok: true, text }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function activate() {
    if (!confirm(`Mark the fee (${rs(open!.fee)}) as paid in cash / at the office and open the course?`)) return;
    try { const r = await api<Row>(`staff/learn/enrollments/${open!.id}/activate`, { body: { note: "Paid at the office" } }); setOpen(r); reload(); setMsg({ ok: true, text: "Course opened." }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <>
      <LearnTabs />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="toolbar"><div className="filters">
        <input type="search" placeholder="Search name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={course} onChange={(e) => setCourse(e.target.value)}><option value="">All courses</option>{courses?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Any status</option><option value="unpaid">Not paid</option><option value="review">Payment being checked</option><option value="active">Studying</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
      </div></div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>No students yet. Share xeonnet.site/courses.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Test</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows?.map((r) => (
            <tr key={r.id}>
              <td><b>{r.student_name}</b><br /><span className="muted small">{r.student_email} · {r.student_phone}</span></td>
              <td className="small">{r.course_title}<br /><span className="muted">{fdate(r.created_at)} · {rs(r.fee)}</span></td>
              <td style={{ minWidth: 120 }}><Progress value={r.progress} /><span className="muted small">{r.progress}%</span></td>
              <td className="small">{r.attempts_used}/{r.attempts_allowed} tries{r.best_score != null ? ` · best ${r.best_score}%` : ""}{r.certificate && <><br /><span className="accent">{r.certificate}</span></>}</td>
              <td><Status s={ST[r.status]} label={r.status_label.toLowerCase()} /></td>
              <td><button className="link small" onClick={() => show(r)}>Open</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {open && (
        <Modal title={`${open.student_name} · ${open.course_title}`} onClose={() => setOpen(null)} wide>
          <div className="stack">
            <p className="small" style={{ margin: 0 }}>{open.student_email} · {open.student_phone} {open.student_phone && <a className="link" href={waLink(open.student_phone, `Hi ${open.student_name}, `)} target="_blank" rel="noopener">WhatsApp</a>}</p>
            <p className="small" style={{ margin: 0 }}>Status: <b>{open.status_label}</b> · Fee {rs(open.fee)} · Enrolled {fdate(open.created_at)}{open.activated_at ? ` · opened ${fdate(open.activated_at)}` : ""}</p>
            {(open.status === "unpaid" || open.status === "review") && can("fees", true) && <button className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={activate}>Paid in cash: open course</button>}
            <section className="panel stack">
              <h3 className="panel-title" style={{ margin: 0 }}>Test tries</h3>
              <p className="small" style={{ margin: 0 }}>Used {open.attempts_used} of {open.attempts_allowed} ({open.attempts_allowed - open.extra_attempts} normal + {open.extra_attempts} extra)</p>
              {attempts?.filter((a) => a.submitted_at).map((a) => <p key={a.id} className="small" style={{ margin: 0 }}>{fdatetime(a.submitted_at)} · <b>{a.score}%</b> ({a.correct_count}/{a.total}) {a.passed ? <Status s="approved" label="passed" /> : <Status s="rejected" label="failed" />}</p>)}
              {can("learning", true) && open.status === "active" && open.attempts_used >= open.attempts_allowed &&
                <button className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => update({ extra_attempts: open.extra_attempts + 1 }, "One more try given. The student was told.")}>Give one more try</button>}
            </section>
            <label className="field">Staff note<textarea rows={2} disabled={!can("learning", true)} defaultValue={open.staff_note} onBlur={(e) => e.target.value !== open.staff_note && update({ staff_note: e.target.value })} /></label>
          </div>
        </Modal>
      )}
    </>
  );
}
