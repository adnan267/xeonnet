"use client";
import { BadgeCheck, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { fdate } from "@/lib/format";

type Result = { found: boolean; code: string; holder_name?: string; doc_type?: string; title?: string; period?: string; issued_on?: string; status?: string; note?: string };

export default function VerifyClient({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial.toUpperCase());
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setBusy(true);
    api<Result>(`public/verify/${encodeURIComponent(initial)}`)
      .then(setRes)
      .catch((e) => setRes(e instanceof ApiError && e.status === 404 ? { found: false, code: initial.toUpperCase() } : null))
      .finally(() => setBusy(false));
  }, [initial]);

  const go = (e: React.FormEvent) => { e.preventDefault(); const c = code.trim().toUpperCase().replace(/\s/g, ""); if (c) router.push(`/verify/${encodeURIComponent(c)}`); };
  const good = res?.found && res.status === "valid";

  return (
    <section className="section">
      <div className="wrap stack" style={{ maxWidth: 760, ["--gap" as string]: "24px" }}>
        <form onSubmit={go} className="card card-pad stack">
          <label className="field">Certificate / document code
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. XN-INT-2026-0101" required maxLength={40} autoComplete="off" style={{ letterSpacing: ".06em", fontSize: 17 }} />
          </label>
          <div className="row"><button className="btn" disabled={busy}>Verify <ShieldCheck /></button><span className="muted small">The code is printed on the document, or scan its QR code.</span></div>
        </form>
        {res && (
          <article className="card card-pad stack" style={{ borderColor: good ? "var(--ok)" : "var(--bad)", background: `linear-gradient(180deg, ${good ? "var(--ok-bg)" : "var(--bad-bg)"}, var(--surface) 55%)` }}>
            <div className="row" style={{ flexWrap: "nowrap", ["--gap" as string]: "14px" }}>
              {good ? <BadgeCheck size={44} color="var(--ok)" /> : res.found ? <ShieldX size={44} color="var(--bad)" /> : <ShieldAlert size={44} color="var(--bad)" />}
              <div>
                <b style={{ fontSize: 19 }}>{good ? "Verified: this document is genuine" : res.found ? "This document has been revoked" : "No record found"}</b>
                <p className="muted small">{good ? "Issued by Xeon Net" : res.found ? "It is no longer valid. Contact Xeon Net for details." : `We could not find a document with the code “${res.code}”. Check the code and try again.`}</p>
              </div>
            </div>
            {res.found && (
              <dl className="sum" style={{ marginTop: 8 }}>
                {[["Issued to", res.holder_name], ["Document", res.doc_type], ["Program / role", res.title], ["Period", res.period], ["Date of issue", fdate(res.issued_on)], ["Remarks", res.note], ["Code", res.code]]
                  .filter(([, v]) => v).map(([k, v]) => <div key={k} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}><dt>{k}</dt><dd style={{ textAlign: "right", wordBreak: "break-all" }}>{v}</dd></div>)}
              </dl>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
