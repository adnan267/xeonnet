"use client";
import Link from "next/link";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Status, useLoad } from "@/components/panel/ui";
import { fdate, money } from "@/lib/format";

type Dash = {
  billing?: { invoiced: string; received: string; outstanding: string; overdue: number; proposals_open: number; proposals_won: number };
  recent_documents?: { id: number; number: string; client_name: string; display_status: string; currency: string; totals: { total: string } }[];
  inbox?: { unread: number; pending_reviews: number; subscribers: number };
  projects?: { active: number };
  my_tasks: { id: number; title: string; project: number; project_title: string; status: string; due_date: string | null; priority: string }[];
  certificates?: number;
  remote?: { to_review: number; withdrawals: number; workers: number };
  learning?: { fees_to_check: number; studying: number };
};

export default function Dashboard() {
  const { me, can } = useMe();
  useTitle("Dashboard");
  const [d] = useLoad<Dash>("staff/dashboard");
  return (
    <div className="stack" style={{ ["--gap" as string]: "24px" }}>
      <div className="row between">
        <div><h2 className="h3">Hello, {me.first_name || me.name}</h2><p className="muted small">Here is what is happening at Xeon Net.</p></div>
        <div className="row">
          {can("documents", true) && <><Link className="btn btn-sm" href="/staff/documents/new?type=invoice">New invoice</Link><Link className="btn btn-ghost btn-sm" href="/staff/documents/new?type=proposal">New proposal</Link></>}
          {can("certificates", true) && <Link className="btn btn-ghost btn-sm" href="/staff/certificates">Issue certificate</Link>}
        </div>
      </div>
      {d?.billing && (
        <div className="kpis">
          <div className="kpi"><b>{money(d.billing.invoiced)}</b><span>Invoiced (all currencies)</span></div>
          <div className="kpi"><b>{money(d.billing.received)}</b><span>Received</span></div>
          <div className="kpi"><b>{money(d.billing.outstanding)}</b><span>Outstanding</span></div>
          <div className="kpi"><b style={{ color: d.billing.overdue ? "var(--bad)" : undefined }}>{d.billing.overdue}</b><span>Overdue invoices</span></div>
          <div className="kpi"><b>{d.billing.proposals_open}</b><span>Proposals awaiting reply</span></div>
          <div className="kpi"><b>{d.billing.proposals_won}</b><span>Proposals accepted</span></div>
        </div>
      )}
      <div className="kpis">
        {d?.learning && can("fees") && <Link href="/staff/learning/payments" className="kpi"><b style={{ color: d.learning.fees_to_check ? "var(--accent)" : undefined }}>{d.learning.fees_to_check}</b><span>Course fees to check · {d.learning.studying} studying</span></Link>}
        {d?.remote && can("remote") && <Link href="/staff/remote" className="kpi"><b style={{ color: d.remote.to_review ? "var(--accent)" : undefined }}>{d.remote.to_review}</b><span>Remote work to review · {d.remote.workers} workers</span></Link>}
        {d?.remote && can("payouts") && <Link href="/staff/remote/withdrawals" className="kpi"><b style={{ color: d.remote.withdrawals ? "var(--accent)" : undefined }}>{d.remote.withdrawals}</b><span>Withdrawals to pay</span></Link>}
        {d?.inbox && <Link href="/staff/inbox" className="kpi"><b>{d.inbox.unread}</b><span>Unread messages · {d.inbox.pending_reviews} reviews to approve</span></Link>}
        {d?.projects && <Link href="/staff/projects" className="kpi"><b>{d.projects.active}</b><span>Active projects</span></Link>}
        {d?.certificates !== undefined && <Link href="/staff/certificates" className="kpi"><b>{d.certificates}</b><span>Valid certificates</span></Link>}
      </div>
      <div className="split split-even">
        {d?.recent_documents && (
          <section className="panel">
            <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Latest documents</h3><Link href="/staff/documents" className="link small">All →</Link></div>
            <table className="tbl" style={{ marginTop: 10 }}><tbody>
              {d.recent_documents.map((x) => (
                <tr key={x.id}><td><Link href={`/staff/documents/${x.id}`}><b>{x.number}</b></Link><br /><span className="muted small">{x.client_name}</span></td><td className="r">{money(x.totals.total, x.currency)}<br /><Status s={x.display_status} /></td></tr>
              ))}
              {!d.recent_documents.length && <tr><td className="muted">Nothing yet.</td></tr>}
            </tbody></table>
          </section>
        )}
        <section className="panel">
          <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>My open tasks</h3><Link href="/staff/tasks" className="link small">All →</Link></div>
          <table className="tbl" style={{ marginTop: 10 }}><tbody>
            {d?.my_tasks.map((t) => (
              <tr key={t.id}><td><Link href={`/staff/projects/${t.project}`}><b>{t.title}</b></Link><br /><span className="muted small">{t.project_title}{t.due_date && ` · due ${fdate(t.due_date)}`}</span></td><td className="r"><Status s={t.status} /></td></tr>
            ))}
            {d && !d.my_tasks.length && <tr><td className="muted">No open tasks. Nice!</td></tr>}
          </tbody></table>
        </section>
      </div>
    </div>
  );
}
