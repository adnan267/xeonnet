"use client";
import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTitle } from "@/components/panel/AppShell";
import { useLoad } from "@/components/panel/ui";
import { company } from "@/lib/content";
import { fdate } from "@/lib/format";

type Cred = { id: number; code: string; holder_name: string; doc_type: string; title: string; period: string; issued_on: string; status: string; note: string };

/** Printable certificate. Use the browser's Print → "Save as PDF" (landscape, no margins, background graphics on). */
export default function CertificatePrint() {
  const { id } = useParams<{ id: string }>();
  const [c, , err] = useLoad<Cred>(`staff/certificates/${id}`);
  useTitle(c ? c.code : "Certificate");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!c) return <p className="muted">Loading…</p>;
  const intern = c.doc_type.startsWith("Internship");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <div className="no-print row" style={{ marginBottom: 16 }}>
        <Link className="btn btn-ghost btn-sm" href="/staff/certificates">← Back</Link>
        <button className="btn btn-sm" onClick={() => window.print()}><Printer /> Print / Save as PDF</button>
        <span className="muted small">In the print window choose <b>Landscape</b>, margins <b>None</b>, and tick <b>Background graphics</b>.</span>
      </div>
      <div className="cert-wrap">
        <div className="cert">
          <i className="stripe s1" /><i className="stripe s2" /><i className="stripe s3" />
          <i className="stripe t1" /><i className="stripe t2" /><i className="stripe t3" />
          <div className="cert-body">
            <img className="cert-logo" src="/img/logo-full-light.png" alt="Xeon Net" />
            <p className="cert-tag">LEARN • GROW • INNOVATE</p>
            <h1 className="cert-title">{intern ? "INTERNSHIP" : c.doc_type.toUpperCase()}</h1>
            {intern && <div className="cert-ribbon">COMPLETION CERTIFICATE</div>}
            <p className="cert-small">This is to certify that</p>
            <p className="cert-name">{c.holder_name}</p>
            <p className="cert-text">
              {intern
                ? <>has successfully completed the Internship Program{c.title ? <> ({c.title})</> : null} at {company.name}{c.period ? <> during the period of <b>{c.period}</b></> : null}.</>
                : <>{c.title ? <>{c.title}. </> : null}{c.period ? <>Period: <b>{c.period}</b>. </> : null}Issued by {company.name}.</>}
              <br />Your dedication, hard work and enthusiasm have been highly appreciated. We wish you all the best for your future endeavors.
            </p>
            <div className="cert-row">
              <div className="cert-sign"><span /><b>Muhammad Adnan</b><small>CEO – Xeon Net</small></div>
              <div className="cert-seal"><b>XN</b><small>XEON NET</small></div>
              <div className="cert-sign"><span /><b>HR Department</b><small>Xeon Net</small></div>
            </div>
            <div className="cert-verify">
              <img src={`/api/public/qr/${c.code}.svg`} alt="" width={78} height={78} />
              <div>
                <small>Certificate No.</small>
                <b className="cert-no">{c.code}</b>
                <small>Date of issue: {fdate(c.issued_on)}</small>
                <small>Verify at {origin.replace(/^https?:\/\//, "")}/verify</small>
              </div>
            </div>
            <p className="cert-foot">0300 6666 190 &nbsp;•&nbsp; info@xeonnet.site &nbsp;•&nbsp; www.xeonnet.site &nbsp;•&nbsp; Business Hub Workspace, Faisalabad</p>
          </div>
        </div>
      </div>
    </>
  );
}
