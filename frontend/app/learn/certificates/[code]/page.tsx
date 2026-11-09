"use client";
import "../../../certificate.css";
import { Printer, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Certificate, { type CertData } from "@/components/Certificate";
import { useTitle } from "@/components/panel/AppShell";
import { useLoad } from "@/components/panel/ui";

type C = CertData & { status: string; course: string };

export default function StudentCertificate() {
  const { code } = useParams<{ code: string }>();
  const [rows, , err] = useLoad<C[]>("learn/certificates");
  const c = rows?.find((x) => x.code === code);
  useTitle(c ? c.code : "Certificate");
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => { if (box.current) setScale(Math.min(1, box.current.clientWidth / 1122.5)); };
    fit(); addEventListener("resize", fit); return () => removeEventListener("resize", fit);
  }, [c]);
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!rows) return <p className="muted">Loading…</p>;
  if (!c) return <p className="alert alert-err">Certificate not found. <Link className="link" href="/learn/certificates">Back</Link></p>;
  const link = typeof window !== "undefined" ? `${window.location.origin}/verify/${c.code}` : "";
  return (
    <>
      <div className="no-print stack" style={{ marginBottom: 16 }}>
        <div className="row">
          <Link className="btn btn-ghost btn-sm" href="/learn/certificates">← Back</Link>
          <button className="btn btn-sm" onClick={() => window.print()}><Printer /> Download PDF / Print</button>
          <button className="btn btn-ghost btn-sm" onClick={() => (navigator.share ? navigator.share({ title: "My Xeon Net certificate", url: link }) : navigator.clipboard?.writeText(link))}><Share2 /> Share verify link</button>
        </div>
        <p className="muted small">In the print window choose <b>Save as PDF</b>, layout <b>Landscape</b>, margins <b>None</b>, and tick <b>Background graphics</b>. Anyone can check it at {link}</p>
      </div>
      <div className="xc-screen" ref={box}>
        <div className="xc-scale" style={{ transform: `scale(${scale})`, height: `${210 * 3.7795 * scale}px` }}>
          <div className="xc-shadow"><Certificate c={c} /></div>
        </div>
      </div>
    </>
  );
}
