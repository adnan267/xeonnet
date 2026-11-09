"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Flash, Modal, useLoad } from "@/components/panel/ui";
import { embedUrl, KindIcon } from "@/components/learn/shared";
import { api } from "@/lib/api";

type Course = {
  id: number; title: string; slug: string; category: string; level: string; summary: string; description: string; outcomes: string; image_url: string;
  price: string; duration: string; certificate_title: string; pass_mark: number; max_attempts: number; questions_per_test: number | null;
  time_limit: number | null; require_all_lessons: boolean; is_published: boolean; sort: number;
};
type L = { id?: number; course: number; section: string; title: string; video_url: string; body: string; file_url: string; file_label: string; minutes: number | null; is_preview: boolean; order: number };
type Q = { id?: number; course: number; text: string; options: string[]; correct: number; order: number };

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useMe();
  const write = can("learning", true);
  const [data] = useLoad<Course>(`staff/learn/courses/${id}`);
  const [c, setC] = useState<Course | null>(null);
  const [lessons, reloadL] = useLoad<L[]>(`staff/learn/lessons?course=${id}`);
  const [questions, reloadQ] = useLoad<Q[]>(`staff/learn/questions?course=${id}`);
  const [editL, setEditL] = useState<L | null>(null);
  const [editQ, setEditQ] = useState<Q | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (data) setC(data); }, [data]);
  useTitle(c?.title ?? "Course");
  if (!c) return <p className="muted">Loading…</p>;
  const bind = (k: keyof Course) => ({ value: (c[k] ?? "") as string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setC({ ...c, [k]: e.target.value }) });
  const fail = (e: unknown) => setMsg({ ok: false, text: (e as Error).message });

  async function saveCourse(e?: React.FormEvent, extra: Partial<Course> = {}) {
    e?.preventDefault();
    try {
      const body = { ...c, ...extra, questions_per_test: c!.questions_per_test || null, time_limit: c!.time_limit || null };
      setC(await api<Course>(`staff/learn/courses/${id}`, { method: "PATCH", body }));
      setMsg({ ok: true, text: extra.is_published === true ? "Published: the course is now on the website." : extra.is_published === false ? "Hidden from the website." : "Saved." });
    } catch (x) { fail(x); }
  }
  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(editL!.id ? `staff/learn/lessons/${editL!.id}` : "staff/learn/lessons", { method: editL!.id ? "PATCH" : "POST", body: { ...editL, minutes: editL!.minutes || null } });
      setEditL(null); reloadL();
    } catch (x) { fail(x); }
  }
  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(editQ!.id ? `staff/learn/questions/${editQ!.id}` : "staff/learn/questions", { method: editQ!.id ? "PATCH" : "POST", body: editQ });
      setEditQ(null); reloadQ();
    } catch (x) { fail(x); }
  }
  async function move(list: L[], i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    await Promise.all([api(`staff/learn/lessons/${a.id}`, { method: "PATCH", body: { order: j } }), api(`staff/learn/lessons/${b.id}`, { method: "PATCH", body: { order: i } })]);
    // make sure every lesson has a distinct order
    await Promise.all(list.map((l, k) => (k !== i && k !== j && l.order !== k ? api(`staff/learn/lessons/${l.id}`, { method: "PATCH", body: { order: k } }) : null)));
    reloadL();
  }
  async function del(kind: "lessons" | "questions", itemId?: number) {
    if (!itemId || !confirm("Delete this?")) return;
    try { await api(`staff/learn/${kind}/${itemId}`, { method: "DELETE" }); if (kind === "lessons") reloadL(); else reloadQ(); } catch (x) { fail(x); }
  }
  async function delCourse() {
    if (!confirm("Delete this course? If students are enrolled it will be hidden instead.")) return;
    try { const r = await api<{ detail?: string } | undefined>(`staff/learn/courses/${id}`, { method: "DELETE" }); if (r?.detail) setMsg({ ok: true, text: r.detail }); else router.replace("/staff/learning"); } catch (x) { fail(x); }
  }
  const nextOrder = (lessons?.length ?? 0);

  return (
    <div className="stack" style={{ ["--gap" as string]: "20px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="row between">
        <Link className="link small" href="/staff/learning">← All courses</Link>
        <div className="row">
          {c.is_published && <a className="btn btn-ghost btn-sm" href={`/courses/${c.slug}`} target="_blank">View on website</a>}
          {write && (c.is_published
            ? <button className="btn btn-ghost btn-sm" onClick={() => saveCourse(undefined, { is_published: false })}>Hide from website</button>
            : <button className="btn btn-sm" onClick={() => saveCourse(undefined, { is_published: true })} disabled={!lessons?.length}>Publish</button>)}
        </div>
      </div>

      <form onSubmit={saveCourse} className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Course details</h3>
        <fieldset disabled={!write} className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="form-grid">
            <label className="field">Title<input required {...bind("title")} /></label>
            <label className="field">Category<input {...bind("category")} placeholder="Web Development, Design…" /></label>
            <label className="field">Level<select {...bind("level")}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            <label className="field">Fee (PKR, 0 = free)<input type="number" min={0} step="1" {...bind("price")} /></label>
            <label className="field">Duration <small>(on certificate)</small><input {...bind("duration")} placeholder="6 Weeks" /></label>
            <label className="field">Name on certificate <small>(optional)</small><input {...bind("certificate_title")} placeholder={c.title} /></label>
          </div>
          <label className="field">Short summary<input maxLength={300} {...bind("summary")} /></label>
          <label className="field">Description<textarea rows={4} {...bind("description")} /></label>
          <label className="field">What students will learn <small>(one per line)</small><textarea rows={4} {...bind("outcomes")} /></label>
          <label className="field">Cover image link <small>(optional)</small><input type="url" {...bind("image_url")} placeholder="https://" /></label>
          <h4 style={{ margin: "8px 0 0" }}>Test rules</h4>
          <div className="form-grid">
            <label className="field">Pass mark %<input type="number" min={1} max={100} {...bind("pass_mark")} /></label>
            <label className="field">Tries allowed<input type="number" min={1} {...bind("max_attempts")} /></label>
            <label className="field">Questions per test <small>(empty = all)</small><input type="number" min={1} value={c.questions_per_test ?? ""} onChange={(e) => setC({ ...c, questions_per_test: e.target.value ? Number(e.target.value) : null })} /></label>
            <label className="field">Time limit, minutes <small>(empty = none)</small><input type="number" min={1} value={c.time_limit ?? ""} onChange={(e) => setC({ ...c, time_limit: e.target.value ? Number(e.target.value) : null })} /></label>
          </div>
          <label className="row" style={{ ["--gap" as string]: "8px" }}><input type="checkbox" checked={c.require_all_lessons} onChange={(e) => setC({ ...c, require_all_lessons: e.target.checked })} /> Students must finish all lessons before the test</label>
          {write && <div className="row"><button className="btn btn-sm">Save details</button><button type="button" className="link danger small" onClick={delCourse}>Delete course</button></div>}
        </fieldset>
      </form>

      <section className="panel stack">
        <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Lessons ({lessons?.length ?? 0})</h3>
          {write && <button className="btn btn-sm" onClick={() => setEditL({ course: c.id, section: lessons?.at(-1)?.section ?? "", title: "", video_url: "", body: "", file_url: "", file_label: "", minutes: null, is_preview: false, order: nextOrder })}><Plus /> Add lesson</button>}</div>
        {lessons && !lessons.length && <p className="muted small">Add the first lesson: a YouTube (unlisted) or Vimeo video, written guidelines and/or a PDF link.</p>}
        <div className="syllabus">
          {lessons?.map((l, i) => (
            <div key={l.id} className="lesson-row">
              <KindIcon k={l.video_url ? "video" : l.file_url && !l.body ? "file" : "text"} />
              <span className="grow">{l.section && <span className="muted small">{l.section} · </span>}<b>{l.title}</b>{l.is_preview && <span className="pill st-active" style={{ marginLeft: 8 }}>preview</span>}</span>
              {write && <>
                <button className="icon-btn" aria-label="Move up" onClick={() => move(lessons, i, -1)}><ArrowUp size={15} /></button>
                <button className="icon-btn" aria-label="Move down" onClick={() => move(lessons, i, 1)}><ArrowDown size={15} /></button>
                <button className="link small" onClick={() => setEditL(l)}>Edit</button>
                <button className="icon-btn" aria-label="Delete lesson" onClick={() => del("lessons", l.id)}><Trash2 size={15} /></button>
              </>}
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Test questions ({questions?.length ?? 0})</h3>
          {write && <button className="btn btn-sm" onClick={() => setEditQ({ course: c.id, text: "", options: ["", "", "", ""], correct: 0, order: questions?.length ?? 0 })}><Plus /> Add question</button>}</div>
        <p className="muted small" style={{ margin: 0 }}>Questions and answer order are shuffled for every student. Add more questions than “questions per test” so each try is different.</p>
        {questions?.map((q, i) => (
          <div key={q.id} className="card card-pad stack" style={{ ["--gap" as string]: "6px", padding: 16 }}>
            <div className="row between"><b>{i + 1}. {q.text}</b>{write && <div className="row"><button className="link small" onClick={() => setEditQ(q)}>Edit</button><button className="icon-btn" aria-label="Delete question" onClick={() => del("questions", q.id)}><Trash2 size={15} /></button></div>}</div>
            <ol type="A" className="small" style={{ margin: 0 }}>{q.options.map((o, k) => <li key={k} style={k === q.correct ? { color: "var(--ok)", fontWeight: 700 } : undefined}>{o}{k === q.correct ? " ✓" : ""}</li>)}</ol>
          </div>
        ))}
      </section>

      {editL && (
        <Modal title={editL.id ? "Edit lesson" : "New lesson"} onClose={() => setEditL(null)} wide>
          <form onSubmit={saveLesson} className="stack">
            <div className="form-grid">
              <label className="field">Title *<input required value={editL.title} onChange={(e) => setEditL({ ...editL, title: e.target.value })} /></label>
              <label className="field">Section <small>(e.g. Week 1)</small><input value={editL.section} onChange={(e) => setEditL({ ...editL, section: e.target.value })} /></label>
              <label className="field">Video link <small>(YouTube / Vimeo)</small><input type="url" value={editL.video_url} onChange={(e) => setEditL({ ...editL, video_url: e.target.value })} placeholder="https://youtu.be/…" />
                {editL.video_url && !embedUrl(editL.video_url) && <small className="err-text">Not a YouTube / Vimeo link: students will get a plain link.</small>}</label>
              <label className="field">Minutes<input type="number" min={1} value={editL.minutes ?? ""} onChange={(e) => setEditL({ ...editL, minutes: e.target.value ? Number(e.target.value) : null })} /></label>
              <label className="field">Notes / PDF link<input type="url" value={editL.file_url} onChange={(e) => setEditL({ ...editL, file_url: e.target.value })} placeholder="Google Drive link" /></label>
              <label className="field">Link button text<input value={editL.file_label} onChange={(e) => setEditL({ ...editL, file_label: e.target.value })} placeholder="Download notes (PDF)" /></label>
            </div>
            <label className="field">Guidelines / notes<textarea rows={8} value={editL.body} onChange={(e) => setEditL({ ...editL, body: e.target.value })} placeholder="Step-by-step guidance for this lesson" /></label>
            <label className="row" style={{ ["--gap" as string]: "8px" }}><input type="checkbox" checked={editL.is_preview} onChange={(e) => setEditL({ ...editL, is_preview: e.target.checked })} /> Free preview (anyone can watch before paying)</label>
            <p className="muted small" style={{ margin: 0 }}>Tip: upload videos to YouTube as <b>Unlisted</b> so only students with the course can find them.</p>
            <div className="row"><button className="btn">Save lesson</button><button type="button" className="btn btn-ghost" onClick={() => setEditL(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
      {editQ && (
        <Modal title={editQ.id ? "Edit question" : "New question"} onClose={() => setEditQ(null)}>
          <form onSubmit={saveQuestion} className="stack">
            <label className="field">Question *<textarea required rows={2} value={editQ.text} onChange={(e) => setEditQ({ ...editQ, text: e.target.value })} /></label>
            {editQ.options.map((o, k) => (
              <label key={k} className="row" style={{ ["--gap" as string]: "8px", flexWrap: "nowrap" }}>
                <input type="radio" name="correct" checked={editQ.correct === k} onChange={() => setEditQ({ ...editQ, correct: k })} title="Right answer" />
                <input style={{ flex: 1 }} value={o} placeholder={`Answer ${String.fromCharCode(65 + k)}`} onChange={(e) => setEditQ({ ...editQ, options: editQ.options.map((x, j) => (j === k ? e.target.value : x)) })} />
                {editQ.options.length > 2 && <button type="button" className="icon-btn" aria-label="Remove answer" onClick={() => setEditQ({ ...editQ, options: editQ.options.filter((_, j) => j !== k), correct: editQ.correct === k ? 0 : editQ.correct > k ? editQ.correct - 1 : editQ.correct })}><Trash2 size={14} /></button>}
              </label>
            ))}
            {editQ.options.length < 6 && <button type="button" className="link small" style={{ alignSelf: "flex-start" }} onClick={() => setEditQ({ ...editQ, options: [...editQ.options, ""] })}>+ Add answer</button>}
            <p className="muted small" style={{ margin: 0 }}>Tick the circle next to the right answer.</p>
            <div className="row"><button className="btn">Save question</button><button type="button" className="btn btn-ghost" onClick={() => setEditQ(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
