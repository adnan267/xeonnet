"use client";
import { Award, BookOpen, CheckCircle2, Clock, FileCheck2, Infinity as Forever, Lock, MessageCircle, PlayCircle, Smartphone } from "lucide-react";
import { LEARN_FAQ } from "@/components/learn/faq";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { groupLessons, hours, KindIcon, LEVEL, rs, Video, type CourseCard, type CourseDetail, type Lesson, type PayInfo } from "@/components/learn/shared";
import { api, ApiError } from "@/lib/api";

type Detail = CourseDetail & { previews: Lesson[]; payment: PayInfo; my_enrollment?: { id: number; status: string } | null };
type Me = { is_student?: boolean; name: string } | null;

export default function CourseClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [c, setC] = useState<Detail | null>(null);
  const [me, setMe] = useState<Me>(null);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState<Lesson | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [others, setOthers] = useState<CourseCard[]>([]);

  useEffect(() => {
    api<CourseCard[]>("public/courses").then((all) => setOthers(all.filter((x) => x.slug !== slug))).catch(() => {});
    api<Detail>(`public/courses/${slug}`).then((d) => { setC(d); document.title = `${d.title} | Xeon Net`; }).catch((e) => setErr(e.status === 404 ? "Course not found." : e.message));
    api<Me>("auth/me").then(setMe).catch(() => setMe(null));
  }, [slug]);

  async function enroll(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setErrors({}); setErr("");
    try {
      const r = await api<{ enrollment: number }>(`public/courses/${slug}/enroll`, { body: me ? {} : f });
      router.push(`/learn/course/${r.enrollment}`);
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object" && !("detail" in (e.data as object)))
        setErrors(Object.fromEntries(Object.entries(e.data as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)])));
      else setErr((e as Error).message);
      setBusy(false);
    }
  }

  if (err && !c) return <section className="section"><div className="wrap"><p className="note err">{err}</p><Link className="link" href="/courses">All courses</Link></div></section>;
  if (!c) return <section className="section"><div className="wrap"><p className="muted">Loading…</p></div></section>;
  const E = ({ k }: { k: string }) => (errors[k] ? <small className="err-text">{errors[k]}</small> : null);
  const enrolled = c.my_enrollment;

  return (
    <>
      <section className="page-hero">
        <div className="wrap stack" style={{ ["--gap" as string]: "14px", maxWidth: 900 }}>
          <Link className="link small" href="/courses">← All courses</Link>
          <span className="eyebrow">{c.category || "Course"} · {LEVEL[c.level]}</span>
          <h1 className="h1">{c.title}</h1>
          <p className="lead">{c.summary}</p>
          <div className="row muted small" style={{ ["--gap" as string]: "18px" }}>
            <span><BookOpen size={15} /> {c.lessons} lessons</span>
            {c.minutes > 0 && <span><Clock size={15} /> {hours(c.minutes)} of lessons</span>}
            {c.duration && <span>{c.duration}</span>}
            <span><Award size={15} /> Certificate after the test</span>
          </div>
        </div>
      </section>
      <section className="section-sm">
        <div className="wrap hero-grid" style={{ alignItems: "start", gap: 40 }}>
          <div className="stack" style={{ ["--gap" as string]: "24px" }}>
            {c.description && <div><h2 className="h3">About this course</h2><p className="muted pre">{c.description}</p></div>}
            {c.outcomes && <div><h2 className="h3">What you will learn</h2>
              <ul className="check-list">{c.outcomes.split("\n").filter(Boolean).map((o) => <li key={o}><CheckCircle2 />{o}</li>)}</ul></div>}
            <div>
              <h2 className="h3">Lessons</h2>
              <div className="syllabus">
                {groupLessons(c.syllabus).map((g, i) => (
                  <div key={i}>
                    {g.section && <h4>{g.section}</h4>}
                    {g.items.map((l) => {
                      const p = c.previews.find((x) => x.id === l.id);
                      return p ? (
                        <button key={l.id} className="lesson-row" onClick={() => setPreview(p)}><KindIcon k={l.kind} /><span className="grow">{l.title}</span><span className="pill st-active">Free preview</span>{l.minutes ? <span className="muted small">{l.minutes} min</span> : null}</button>
                      ) : (
                        <div key={l.id} className="lesson-row"><KindIcon k={l.kind} /><span className="grow">{l.title}</span><Lock size={14} className="muted" />{l.minutes ? <span className="muted small">{l.minutes} min</span> : null}</div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {preview && (
              <div className="card card-pad stack" id="preview">
                <div className="row between"><b><PlayCircle size={16} /> {preview.title}</b><button className="link small" onClick={() => setPreview(null)}>Close</button></div>
                {preview.video_url && <Video url={preview.video_url} title={preview.title} />}
                {preview.body && <p className="pre small">{preview.body}</p>}
              </div>
            )}
            <div className="card card-pad row" style={{ ["--gap" as string]: "16px", flexWrap: "nowrap", alignItems: "flex-start" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo-mark.png" alt="" width={56} height={36} style={{ objectFit: "contain", flex: "none", marginTop: 4 }} />
              <div><h3 className="h3" style={{ margin: 0 }}>Your instructors: the Xeon Net team</h3>
                <p className="muted small" style={{ margin: "6px 0 0" }}>Lessons are prepared by the developers, designers and marketers who work on Xeon Net client projects, led by CEO Muhammad Adnan. Questions? Message us on WhatsApp and we will help.</p></div>
            </div>
            {c.questions > 0 && <div className="card card-pad"><h3 className="h3" style={{ marginTop: 0 }}>Final test</h3>
              <p className="muted small" style={{ margin: 0 }}>{c.questions_per_test ? Math.min(c.questions_per_test, c.questions) : c.questions} multiple-choice questions · pass mark {c.pass_mark}% · up to {c.max_attempts} tries{c.time_limit ? ` · ${c.time_limit} minutes` : ""}. Pass to receive your certificate.</p></div>}
          </div>

          <aside className="card card-pad stack" style={{ position: "sticky", top: 90 }}>
            <span className="muted small">Course fee</span>
            <b style={{ fontSize: 32 }}>{rs(c.price)}</b>
            <ul className="includes">
              <li><BookOpen size={17} />{c.lessons} lessons{c.minutes > 0 ? ` · ${hours(c.minutes)}` : ""}</li>
              <li><FileCheck2 size={17} />Final test, marked instantly</li>
              <li><Award size={17} />Verifiable certificate with QR code</li>
              <li><Forever size={17} />No time limit to finish</li>
              <li><Smartphone size={17} />Learn on phone or computer</li>
              <li><MessageCircle size={17} />Help on WhatsApp</li>
            </ul>
            {enrolled ? (
              <><p className="muted small" style={{ margin: 0 }}>You are enrolled in this course.</p><Link className="btn" href={`/learn/course/${enrolled.id}`}>Go to my course</Link></>
            ) : !c.payment.enroll_open ? <p className="note err">Enrolment is closed right now.</p> : me && !me.is_student ? (
              <p className="note err">You are logged in with a staff / client / worker account. Log out and enroll with your own email.</p>
            ) : me ? (
              <button className="btn" disabled={busy} onClick={() => enroll()}>{busy ? "Enrolling…" : Number(c.price) > 0 ? "Enroll & pay" : "Enroll free"}</button>
            ) : (
              <form onSubmit={enroll} className="stack" style={{ ["--gap" as string]: "10px" }}>
                <p className="small" style={{ margin: 0 }}>Create your student account to enroll:</p>
                <label className="field">Full name <small>(for your certificate)</small><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /><E k="name" /></label>
                <label className="field">Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /><E k="email" /></label>
                <label className="field">Mobile / WhatsApp<input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" placeholder="03xx xxxxxxx" /><E k="phone" /></label>
                <label className="field">Password<input required type="password" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /><E k="password" /></label>
                <button className="btn" disabled={busy}>{busy ? "Creating account…" : Number(c.price) > 0 ? "Enroll & continue to payment" : "Enroll free"}</button>
                <span className="muted small">Already a student? <Link className="link" href={`/login?next=/courses/${slug}`}>Log in</Link></span>
              </form>
            )}
            {err && <p className="note err">{err}</p>}
            {Number(c.price) > 0 && <p className="muted small" style={{ margin: 0 }}>Pay by JazzCash, Easypaisa or bank transfer. The course opens as soon as we confirm your payment.</p>}
          </aside>
        </div>
      </section>
      <section className="section-sm section-alt">
        <div className="wrap hero-grid" style={{ alignItems: "start", gap: 48 }}>
          <div>
            <h2 className="h3">Questions</h2>
            <div className="faq">{LEARN_FAQ.slice(0, 5).map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
          </div>
          {others.length > 0 && (
            <div className="stack" style={{ ["--gap" as string]: "12px" }}>
              <h2 className="h3">More courses</h2>
              {[...others.filter((o) => o.category === c.category), ...others.filter((o) => o.category !== c.category)].slice(0, 4).map((o) => (
                <Link key={o.slug} href={`/courses/${o.slug}`} className="card card-pad row between" style={{ padding: 16 }}>
                  <span><b>{o.title}</b><br /><span className="muted small">{o.lessons} lessons{o.duration ? ` · ${o.duration}` : ""}</span></span>
                  <b className="accent">{rs(o.price)}</b>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
