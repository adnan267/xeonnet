"use client";
import { FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Empty, Status, useLoad } from "@/components/panel/ui";
import { fdate, money } from "@/lib/format";

type Row = { id: number; doc_type: string; number: string; client_name: string; client_company: string; title: string; issue_date: string; due_date: string | null; currency: string; display_status: string; totals: { total: string; balance: string } };

export default function Documents() {
  useTitle("Proposals & Invoices");
  const { can } = useMe();
  const router = useRouter();
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [rows] = useLoad<Row[]>(`staff/documents?type=${type}&status=${status}&q=${encodeURIComponent(q)}`, [type, status, q]);
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <input type="search" placeholder="Search number, client, title…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option><option value="proposal">Proposals</option><option value="invoice">Invoices</option></select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {["draft", "sent", "accepted", "rejected", "partial", "paid", "overdue", "cancelled"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        {can("documents", true) && <div className="row">
          <Link className="btn btn-sm" href="/staff/documents/new?type=proposal"><FileText /> New proposal</Link>
          <Link className="btn btn-sm" href="/staff/documents/new?type=invoice"><Receipt /> New invoice</Link>
        </div>}
      </div>
      {rows && !rows.length ? <Empty>Nothing here yet. Add a client, then create a proposal or invoice.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Number</th><th>Client</th><th>Date</th><th className="r">Total</th><th className="r">Balance</th><th>Status</th></tr></thead>
          <tbody>{rows?.map((d) => (
            <tr key={d.id} className="click" onClick={() => router.push(`/staff/documents/${d.id}`)}>
              <td><Link href={`/staff/documents/${d.id}`}><b>{d.number}</b></Link><br /><span className="muted small">{d.title || d.doc_type}</span></td>
              <td>{d.client_name}{d.client_company && <><br /><span className="muted small">{d.client_company}</span></>}</td>
              <td>{fdate(d.issue_date)}{d.due_date && <><br /><span className="muted small">due {fdate(d.due_date)}</span></>}</td>
              <td className="r">{money(d.totals.total, d.currency)}</td>
              <td className="r">{d.doc_type === "invoice" ? money(d.totals.balance, d.currency) : "—"}</td>
              <td><Status s={d.display_status} /></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
