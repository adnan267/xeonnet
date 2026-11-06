"use client";
import Link from "next/link";
import { useMe, useTitle } from "@/components/panel/AppShell";
import type { P } from "@/components/panel/ProjectForm";
import { Progress, Status, useLoad } from "@/components/panel/ui";
import { company } from "@/lib/content";
import { fdate, money } from "@/lib/format";

type Row = { id: number; doc_type: string; number: string; title: string; issue_date: string; due_date: string | null; currency: string; display_status: string; totals: { total: string; balance: string } };
type Sum = { outstanding: Record<string, string>; documents: Row[]; projects: P[] };

export default function PortalHome() {
  const { me } = useMe();
  useTitle("Overview");
  const [s] = useLoad<Sum>("portal/summary");
  const due = s ? Object.entries(s.outstanding) : [];
  const open = s?.documents.filter((d) => ["sent", "partial", "overdue"].includes(d.display_status)) || [];
  return (
    <div className="stack" style={{ ["--gap" as string]: "24px" }}>
      <div><h2 className="h3">Welcome, {me.client?.name || me.name}</h2><p className="muted small">Your proposals, invoices and projects with {company.name}, in one place.</p></div>
      <div className="kpis">
        <div className="kpi"><b style={{ color: due.length ? "var(--accent)" : undefined }}>{due.length ? due.map(([c, v]) => money(v, c)).join(" + ") : "Nothing due"}</b><span>Outstanding balance</span></div>
        <div className="kpi"><b>{open.length}</b><span>Open invoices / proposals</span></div>
        <div className="kpi"><b>{s?.projects.length ?? "–"}</b><span>Projects</span></div>
      </div>
      <div className="split split-even">
        <section className="panel">
          <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Recent documents</h3><Link className="link small" href="/portal/documents">All →</Link></div>
          <table className="tbl" style={{ marginTop: 10 }}><tbody>
            {s?.documents.map((d) => <tr key={d.id}><td><Link href={`/portal/documents/${d.id}`}><b>{d.number}</b></Link><br /><span className="muted small">{d.title || d.doc_type} · {fdate(d.issue_date)}</span></td><td className="r">{money(d.totals.total, d.currency)}<br /><Status s={d.display_status} /></td></tr>)}
            {s && !s.documents.length && <tr><td className="muted">No documents yet.</td></tr>}
          </tbody></table>
        </section>
        <section className="panel stack">
          <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Projects</h3><Link className="link small" href="/portal/projects">All →</Link></div>
          {s?.projects.map((p) => <Link key={p.id} href={`/portal/projects/${p.id}`} className="stack" style={{ ["--gap" as string]: "6px", borderTop: "1px solid var(--line)", paddingTop: 12 }}><div className="row between"><b>{p.title}</b><Status s={p.status} /></div><Progress value={p.progress} /><span className="muted small">{p.progress}% complete{p.due_date && ` · deadline ${fdate(p.due_date)}`}</span></Link>)}
          {s && !s.projects.length && <p className="muted small">No projects yet.</p>}
        </section>
      </div>
    </div>
  );
}
