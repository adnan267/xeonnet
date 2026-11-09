"use client";
import Link from "next/link";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Progress, Status, useLoad } from "@/components/panel/ui";
import { rs, ST } from "@/components/learn/shared";
import type { Home } from "@/components/learn/types";

export default function MyCourses() {
  const { me } = useMe();
  useTitle("My courses");
  const [h, , err] = useLoad<Home>("learn/home");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!h) return <p className="muted">Loading…</p>;
  return (
    <div className="stack" style={{ ["--gap" as string]: "22px" }}>
      <div><h2 className="h3">Hi {me.first_name || me.name}</h2><p className="muted small">Your courses, progress and certificates.</p></div>
      {!h.enrollments.length && <div className="panel stack"><p style={{ margin: 0 }}>You are not enrolled in a course yet.</p><Link className="btn" style={{ alignSelf: "flex-start" }} href="/courses">Browse courses</Link></div>}
      <div className="grid" style={{ ["--min" as string]: "300px" }}>
        {h.enrollments.map((e) => (
          <Link key={e.id} href={`/learn/course/${e.id}`} className="card card-pad stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between"><Status s={ST[e.status]} label={e.status_label.toLowerCase()} /><span className="muted small">{rs(e.fee)}</span></div>
            <b>{e.course_title}</b>
            {e.status === "unpaid" && <span className="small">Pay the fee to open the lessons →</span>}
            {e.status === "review" && <span className="small muted">We are checking your payment. The course opens as soon as it is confirmed.</span>}
            {(e.status === "active" || e.status === "completed") && <><Progress value={e.progress} /><span className="muted small">{e.progress}% of lessons done{e.best_score != null ? ` · best test score ${e.best_score}%` : ""}</span></>}
            {e.certificate && <span className="small accent">Certificate {e.certificate}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
