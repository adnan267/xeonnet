"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Empty, Status, useLoad } from "@/components/panel/ui";
import { fdate, money } from "@/lib/format";

type Row = { id: number; doc_type: string; number: string; title: string; issue_date: string; due_date: string | null; currency: string; display_status: string; totals: { total: string; balance: string } };

export default function PortalDocs() {
  useTitle("Invoices & Proposals");
  const router = useRouter();
  const [type, setType] = useState("");
  const [rows] = useLoad<Row[]>(`portal/documents${type ? `?type=${type}` : ""}`, [type]);
  return (
    <>
      <div className="toolbar"><div className="filters"><select value={type} onChange={(e) => setType(e.target.value)}><option value="">All</option><option value="invoice">Invoices</option><option value="proposal">Proposals</option></select></div></div>
      {rows && !rows.length ? <Empty>No documents yet.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Number</th><th>Date</th><th className="r">Total</th><th className="r">Balance</th><th>Status</th></tr></thead>
          <tbody>{rows?.map((d) => (
            <tr key={d.id} className="click" onClick={() => router.push(`/portal/documents/${d.id}`)}>
              <td><Link href={`/portal/documents/${d.id}`}><b>{d.number}</b></Link><br /><span className="muted small">{d.title || d.doc_type}</span></td>
              <td>{fdate(d.issue_date)}{d.due_date && <><br /><span className="muted small">{d.doc_type === "invoice" ? "due" : "valid until"} {fdate(d.due_date)}</span></>}</td>
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
