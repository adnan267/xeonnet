"use client";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTitle } from "@/components/panel/AppShell";
import type { P } from "@/components/panel/ProjectForm";
import { Progress, Status, useLoad } from "@/components/panel/ui";
import { fdate, fdatetime, money } from "@/lib/format";

type Detail = P & {
  tasks: { id: number; title: string; status: string; due_date: string | null }[];
  updates: { id: number; author_name: string; text: string; created_at: string }[];
  documents: { id: number; number: string; doc_type: string; currency: string; display_status: string; totals: { total: string } }[];
};

export default function PortalProject() {
  const { id } = useParams<{ id: string }>();
  const [p, , err] = useLoad<Detail>(`portal/projects/${id}`);
  useTitle(p?.title || "Project");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!p) return <p className="muted">Loading…</p>;
  const icon = (s: string) => (s === "done" ? <CheckCircle2 size={18} color="var(--ok)" /> : s === "doing" ? <CircleDot size={18} color="var(--info)" /> : <Circle size={18} color="var(--muted)" />);
  return (
    <div className="stack" style={{ ["--gap" as string]: "20px" }}>
      <Link href="/portal/projects" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>← My projects</Link>
      <section className="panel stack" style={{ ["--gap" as string]: "10px" }}>
        <div className="row between"><Status s={p.status} /><span className="muted small">{p.start_date && `Started ${fdate(p.start_date)}`}{p.due_date && ` · Deadline ${fdate(p.due_date)}`}</span></div>
        {p.description && <p className="muted" style={{ whiteSpace: "pre-line" }}>{p.description}</p>}
        <Progress value={p.progress} /><span className="small muted">{p.progress}% complete{p.manager_detail && ` · Your contact: ${p.manager_detail.name}`}</span>
      </section>
      <div className="split split-even">
        <section className="panel stack" style={{ ["--gap" as string]: "10px" }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Milestones</h3>
          {p.tasks.map((t) => <div key={t.id} className="row" style={{ flexWrap: "nowrap" }}>{icon(t.status)}<span style={{ textDecoration: t.status === "done" ? "line-through" : undefined }}>{t.title}</span>{t.due_date && <span className="muted small">· {fdate(t.due_date)}</span>}</div>)}
          {!p.tasks.length && <p className="muted small">Milestones will appear here.</p>}
        </section>
        <section className="panel stack">
          <h3 className="panel-title" style={{ margin: 0 }}>Updates from the team</h3>
          {p.updates.map((u) => <div key={u.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}><p className="muted small"><b style={{ color: "var(--text)" }}>{u.author_name}</b> · {fdatetime(u.created_at)}</p><p style={{ whiteSpace: "pre-line" }}>{u.text}</p></div>)}
          {!p.updates.length && <p className="muted small">No updates yet.</p>}
        </section>
      </div>
      {p.documents.length > 0 && (
        <section className="panel">
          <h3 className="panel-title">Documents for this project</h3>
          <table className="tbl"><tbody>{p.documents.map((d) => <tr key={d.id}><td><Link href={`/portal/documents/${d.id}`} className="link">{d.number}</Link></td><td className="r">{money(d.totals.total, d.currency)}</td><td><Status s={d.display_status} /></td></tr>)}</tbody></table>
        </section>
      )}
    </div>
  );
}
