"use client";
import "../../../../certificate.css";
import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Certificate, { type CertData } from "@/components/Certificate";
import { useTitle } from "@/components/panel/AppShell";
import { useLoad } from "@/components/panel/ui";

/** Printable certificate. Print → "Save as PDF" gives an A4 landscape PDF. */
export default function CertificatePrint() {
  const { id } = useParams<{ id: string }>();
  const [c, , err] = useLoad<CertData & { status: string }>(`staff/certificates/${id}/printable`);
  useTitle(c ? c.code : "Certificate");
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => { if (box.current) setScale(Math.min(1, box.current.clientWidth / 1122.5)); };
    fit(); addEventListener("resize", fit); return () => removeEventListener("resize", fit);
  }, [c]);
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!c) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="no-print stack" style={{ marginBottom: 16 }}>
        <div className="row">
          <Link className="btn btn-ghost btn-sm" href="/staff/certificates">← Back</Link>
          <button className="btn btn-sm" onClick={() => window.print()}><Printer /> Print / Save as PDF</button>
        </div>
        <p className="muted small">In the print window choose <b>Save as PDF</b>, layout <b>Landscape</b>, margins <b>None</b>, and tick <b>Background graphics</b>.</p>
        {c.status !== "valid" && <p className="alert alert-err">This certificate is revoked. The verify page will show it as not valid.</p>}
        {(!c.ceo_signature || !c.hr_signature) && <p className="alert">Signature images are missing. Upload them in <Link href="/staff/settings">Settings → Certificate signatures</Link>.</p>}
      </div>
      <div className="xc-screen" ref={box}>
        <div className="xc-scale" style={{ transform: `scale(${scale})`, height: `${210 * 3.7795 * scale}px` }}>
          <div className="xc-shadow"><Certificate c={c} /></div>
        </div>
      </div>
    </>
  );
}
