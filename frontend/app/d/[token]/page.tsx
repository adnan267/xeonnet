"use client";
import { Download, MessageCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DocPaper, { type Doc } from "@/components/DocPaper";
import { Brand } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { company } from "@/lib/content";

export default function PublicDoc() {
  const { token } = useParams<{ token: string }>();
  const [d, setD] = useState<Doc | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Doc>(`public/documents/${token}`).then(setD).catch(() => setErr("This document link is not valid.")); }, [token]);
  useEffect(() => { if (d) document.title = `${d.doc_type === "invoice" ? "Invoice" : "Proposal"} ${d.number} | Xeon Net`; }, [d]);

  async function accept() {
    if (!confirm("Accept this proposal?")) return;
    setBusy(true);
    try { setD(await api<Doc>(`public/documents/${token}/accept`, { body: {} })); } finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <meta name="robots" content="noindex,nofollow" />
      <header className="no-print" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap row between" style={{ height: 72 }}>
          <Brand />
          <div className="row">
            {d && <button className="btn btn-sm" onClick={() => window.print()}><Download /> Download / Print PDF</button>}
            <a className="btn btn-ghost btn-sm hide-sm" href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener"><MessageCircle /> WhatsApp us</a>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="wrap" style={{ padding: "32px 16px 64px", maxWidth: 900 }}>
        {err && <p className="alert alert-err">{err}</p>}
        {!d && !err && <p className="muted center">Loading…</p>}
        {d && <>
          {d.doc_type === "proposal" && d.status === "accepted" && <p className="alert alert-ok no-print" style={{ marginBottom: 20 }}>This proposal has been accepted. Thank you!</p>}
          <DocPaper d={d} />
          {d.doc_type === "proposal" && d.status === "sent" && (
            <div className="card card-pad center no-print stack" style={{ marginTop: 24, borderColor: "var(--brand)", alignItems: "center" }}>
              <p><b>Happy with this proposal?</b> Accept it online and we will get started right away.</p>
              <button className="btn" onClick={accept} disabled={busy}>Accept proposal</button>
            </div>
          )}
        </>}
      </main>
    </div>
  );
}
