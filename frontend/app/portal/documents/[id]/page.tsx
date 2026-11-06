"use client";
import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import DocPaper, { type Doc } from "@/components/DocPaper";
import { useTitle } from "@/components/panel/AppShell";
import { useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { company } from "@/lib/content";

export default function PortalDoc() {
  const { id } = useParams<{ id: string }>();
  const [d, , err, setD] = useLoad<Doc>(`portal/documents/${id}`);
  const [busy, setBusy] = useState(false);
  useTitle(d?.number || "Document");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!d) return <p className="muted">Loading…</p>;
  async function accept() {
    if (!confirm("Accept this proposal?")) return;
    setBusy(true);
    try { setD(await api<Doc>(`portal/documents/${id}/accept`, { body: {} })); } finally { setBusy(false); }
  }
  return (
    <>
      <div className="toolbar no-print">
        <Link href="/portal/documents" className="btn btn-ghost btn-sm">← All documents</Link>
        <div className="row">
          <button className="btn btn-sm" onClick={() => window.print()}><Printer /> Download / Print PDF</button>
          <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener" href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(`Hello Xeon Net, I have a question about ${d.number}.`)}`}>Ask a question</a>
        </div>
      </div>
      {d.doc_type === "proposal" && d.status === "sent" && (
        <div className="panel row between no-print" style={{ marginBottom: 20, borderColor: "var(--brand)" }}>
          <span><b>Happy with this proposal?</b> Accept it and we will get started.</span>
          <button className="btn btn-sm" onClick={accept} disabled={busy}>Accept proposal</button>
        </div>
      )}
      {d.doc_type === "invoice" && Number(d.totals.balance) > 0 && d.bank.length > 0 && (
        <p className="alert alert-info no-print" style={{ marginBottom: 20 }}>To pay, use the payment details at the bottom of the invoice and mention {d.number}. Your payment will show here once recorded.</p>
      )}
      <DocPaper d={d} />
    </>
  );
}
