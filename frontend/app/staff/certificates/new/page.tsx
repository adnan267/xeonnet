"use client";
import "../../../certificate.css";
import { Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Certificate from "@/components/Certificate";
import { useTitle } from "@/components/panel/AppShell";
import { useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";

type Blank = { next_code: string; issued_on: string; ceo_signature: string; hr_signature: string };

/** Work out "3 Months" / "2 Weeks" from the dates (same rule as the server). */
function duration(start: string, end: string) {
  if (!start || !end) return "";
  const days = Math.round((new Date(end + "T00:00:00").getTime() - new Date(start + "T00:00:00").getTime()) / 864e5) + 1;
  if (days <= 0) return "";
  if (days >= 28) { const n = Math.max(1, Math.round(days / 30.44)); return `${n} Month${n > 1 ? "s" : ""}`; }
  const n = Math.max(1, Math.round(days / 7)); return `${n} Week${n > 1 ? "s" : ""}`;
}

export default function NewCertificate() {
  useTitle("New internship certificate");
  const router = useRouter();
  const [blank, , loadErr] = useLoad<Blank>("staff/certificates/blank");
  const [f, setF] = useState({ name: "", field: "", duration: "", start: "", end: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const fit = () => { if (box.current) setScale(Math.min(1, box.current.clientWidth / 1122.5)); };
    fit(); addEventListener("resize", fit); return () => removeEventListener("resize", fit);
  }, [blank]);

  const auto = duration(f.start, f.end);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function issue(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (f.start && f.end && f.end < f.start) { setErr("End date is before the start date."); return; }
    setBusy(true);
    try {
      const c = await api<{ id: number }>("staff/certificates", { method: "POST", body: {
        holder_name: f.name.trim(), doc_type: "Internship Completion Certificate", title: f.field.trim(),
        duration: f.duration.trim() || auto, start_date: f.start || null, end_date: f.end || null } });
      router.push(`/staff/certificates/${c.id}/print?print=1`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  if (loadErr) return <p className="alert alert-err">{loadErr}</p>;
  if (!blank) return <p className="muted">Loading…</p>;
  return (
    <div className="stack" style={{ ["--gap" as string]: "18px" }}>
      <form onSubmit={issue} className="panel stack">
        <div className="form-grid">
          <label className="field">Intern name *<input required autoFocus value={f.name} onChange={set("name")} placeholder="Full name as it should be printed" /></label>
          <label className="field">Focus (internship field) *<input required value={f.field} onChange={set("field")} placeholder="Full Stack Web Development" /></label>
          <label className="field">Start date *<input required type="date" value={f.start} onChange={set("start")} /></label>
          <label className="field">End date *<input required type="date" value={f.end} onChange={set("end")} /></label>
          <label className="field">Duration <small>(left empty = {auto || "from the dates"})</small><input value={f.duration} onChange={set("duration")} placeholder={auto || "3 Months"} /></label>
          <div className="field">Filled in automatically
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>Number <b>{blank.next_code}</b> · Issue date <b>today</b> · QR code for <b>xeonnet.site/verify</b></p>
          </div>
        </div>
        {err && <p className="alert alert-err">{err}</p>}
        <div className="row">
          <button className="btn" disabled={busy}><Printer /> {busy ? "Issuing…" : "Issue & print"}</button>
          <Link className="btn btn-ghost" href="/staff/certificates">Cancel</Link>
          {(!blank.ceo_signature || !blank.hr_signature) && <span className="muted small">Signatures missing: upload them in <Link className="link" href="/staff/settings">Settings</Link>.</span>}
        </div>
      </form>
      <div className="xc-screen" ref={box}>
        <div className="xc-scale" style={{ transform: `scale(${scale})`, height: `${210 * 3.7795 * scale}px` }}>
          <div className="xc-shadow">
            <Certificate c={{ code: blank.next_code, issued_on: blank.issued_on, holder_name: f.name, doc_type: "Internship Completion Certificate",
              title: f.field, duration: f.duration || auto, start_date: f.start || null, end_date: f.end || null, period: "",
              ceo_signature: blank.ceo_signature, hr_signature: blank.hr_signature, qr_off: true }} />
          </div>
        </div>
      </div>
      <p className="muted small">Preview. The number is confirmed when you press Issue &amp; print (if someone else issues one at the same moment, you get the next number). The QR code is added on the printed certificate.</p>
    </div>
  );
}
