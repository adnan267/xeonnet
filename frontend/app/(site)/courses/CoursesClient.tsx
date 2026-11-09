"use client";
import { Award, BookOpen, CheckCircle2, Clock, GraduationCap, Search, ShieldCheck, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LEARN_FAQ } from "@/components/learn/faq";
import { hours, LEVEL, rs, type CourseCard } from "@/components/learn/shared";
import { api } from "@/lib/api";
import { photo } from "@/lib/content";

const STEPS = [
  { icon: BookOpen, title: "Enroll", text: "Create your student account and pay the fee by JazzCash, Easypaisa or bank transfer." },
  { icon: GraduationCap, title: "Learn", text: "Watch the video lessons and follow the written guidelines at your own pace." },
  { icon: CheckCircle2, title: "Take the test", text: "A multiple-choice test, marked instantly. You get up to 3 tries." },
  { icon: Award, title: "Get certified", text: "Pass and download your Xeon Net certificate with a number and QR code anyone can verify." },
];

export default function CoursesClient() {
  const [rows, setRows] = useState<CourseCard[] | null>(null);
  const [err, setErr] = useState("");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  useEffect(() => { api<CourseCard[]>("public/courses").then(setRows).catch((e) => setErr(e.message)); }, []);
  const cats = useMemo(() => ["All", ...Array.from(new Set((rows ?? []).map((c) => c.category).filter(Boolean))), ...(rows?.some((c) => Number(c.price) === 0) ? ["Free"] : [])], [rows]);
  const shown = (rows ?? []).filter((c) => (cat === "All" || (cat === "Free" ? Number(c.price) === 0 : c.category === cat))
    && (!q.trim() || `${c.title} ${c.summary} ${c.category}`.toLowerCase().includes(q.trim().toLowerCase())));
  const lessons = (rows ?? []).reduce((a, c) => a + c.lessons, 0);
  return (
    <>
      {rows && rows.length > 0 && (
        <section className="section-sm" style={{ paddingBottom: 0 }}>
          <div className="wrap kpis">
            <div className="kpi"><b>{rows.length}</b><span>Courses</span></div>
            <div className="kpi"><b>{lessons}</b><span>Lessons</span></div>
            <div className="kpi"><b>{rows.filter((c) => Number(c.price) === 0).length}</b><span>Free courses</span></div>
            <div className="kpi"><b>100%</b><span>Verifiable certificates</span></div>
          </div>
        </section>
      )}
      <section className="section" id="all-courses">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Courses</span><h2>Start learning</h2></div>
          {err && <p className="note err">{err}</p>}
          {!rows && !err && <p className="muted">Loading courses…</p>}
          {rows && !rows.length && <p className="muted">New courses are coming soon. Follow us or <Link className="link" href="/contact">contact us</Link> to hear first.</p>}
          {rows && rows.length > 0 && (
            <div className="row between" style={{ marginBottom: 22 }}>
              <div className="chips">{cats.map((c) => <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
              <label className="search-box"><Search size={16} /><input type="search" placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            </div>
          )}
          {rows && rows.length > 0 && !shown.length && <p className="muted">No course matches. Try another word.</p>}
          <div className="grid" style={{ ["--min" as string]: "300px" }}>
            {shown.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="card course-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image_url || photo(c.category.toLowerCase().includes("market") ? "digital-marketing" : c.category.toLowerCase().includes("web") ? "web-development" : "software", 800)} alt="" loading="lazy" />
                <div className="card-pad stack" style={{ ["--gap" as string]: "10px", padding: 22 }}>
                  <div className="row between"><span className="pill">{c.category || LEVEL[c.level]}</span>{Number(c.price) > 0 ? <b className="accent">{rs(c.price)}</b> : <span className="pill st-approved">Free</span>}</div>
                  <h3 className="h3" style={{ margin: 0 }}>{c.title}</h3>
                  <p className="muted small" style={{ margin: 0 }}>{c.summary}</p>
                  <div className="row muted small" style={{ ["--gap" as string]: "14px" }}>
                    <span><BookOpen size={14} /> {c.lessons} lessons</span>
                    {c.minutes > 0 && <span><Clock size={14} /> {hours(c.minutes)}</span>}
                    {c.duration && <span>{c.duration}</span>}
                    <span>{LEVEL[c.level]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">How it works</span><h2>From first lesson to certificate</h2></div>
          <div className="grid" style={{ ["--min" as string]: "220px" }}>
            {STEPS.map((s, i) => (
              <div key={s.title} className="card card-pad stack" style={{ ["--gap" as string]: "12px" }}>
                <div className="row between"><span className="icon-box"><s.icon /></span><span className="pill">Step {i + 1}</span></div>
                <h3 className="h3">{s.title}</h3>
                <p className="muted small">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 20 }}><ShieldCheck size={15} /> Every certificate can be checked at <Link className="link" href="/verify">xeonnet.site/verify</Link>.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap hero-grid" style={{ alignItems: "start", gap: 48 }}>
          <div className="stack" style={{ ["--gap" as string]: "16px" }}>
            <span className="eyebrow">Why learn with Xeon Net</span>
            <h2 className="h2">Taught by people who do the work</h2>
            <ul className="check-list">
              <li><Users />Lessons written by the Xeon Net team, from real client projects since 2007.</li>
              <li><Clock />Learn at your own pace, with no deadline to finish.</li>
              <li><Smartphone />Study on your phone, tablet or computer.</li>
              <li><Award />A certificate with a number and QR code that employers can verify.</li>
              <li><GraduationCap />Students can apply for Xeon Net internships and remote work.</li>
            </ul>
            <div className="row"><Link className="btn" href="#all-courses">Browse courses</Link><Link className="btn btn-ghost" href="/careers">Remote jobs</Link></div>
          </div>
          <div className="faq">{LEARN_FAQ.map(([qq, a]) => <details key={qq}><summary>{qq}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>
    </>
  );
}
