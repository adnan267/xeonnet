"use client";
import { Award, BookOpen, CheckCircle2, Clock, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  useEffect(() => { api<CourseCard[]>("public/courses").then(setRows).catch((e) => setErr(e.message)); }, []);
  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Courses</span><h2>Start learning</h2></div>
          {err && <p className="note err">{err}</p>}
          {!rows && !err && <p className="muted">Loading courses…</p>}
          {rows && !rows.length && <p className="muted">New courses are coming soon. Follow us or <Link className="link" href="/contact">contact us</Link> to hear first.</p>}
          <div className="grid" style={{ ["--min" as string]: "300px" }}>
            {rows?.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="card course-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image_url || photo(c.category.toLowerCase().includes("market") ? "digital-marketing" : c.category.toLowerCase().includes("web") ? "web-development" : "software", 800)} alt="" loading="lazy" />
                <div className="card-pad stack" style={{ ["--gap" as string]: "10px", padding: 22 }}>
                  <div className="row between"><span className="pill">{c.category || LEVEL[c.level]}</span><b className="accent">{rs(c.price)}</b></div>
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
    </>
  );
}
