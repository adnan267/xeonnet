"use client";
import { useEffect, useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Flash, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";

type S = {
  bank_name: string; account_title: string; account_number: string; iban: string; other_payment: string;
  invoice_start: number; proposal_start: number; certificate_start: number; certificate_start_year: number; email_enabled: boolean; sms_enabled: boolean;
  remind_days_before: number; overdue_repeat_days: number; proposal_terms: string; invoice_terms: string;
  ceo_signature: string; hr_signature: string;
  providers: { email: string; sms: string };
};

/** Reads an image file and shrinks it (max 900 px wide) so it stays small; keeps transparency. */
function readSignature(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 900 / img.width), cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src); resolve(cv.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("That file is not an image."));
    img.src = URL.createObjectURL(file);
  });
}

export default function Settings() {
  useTitle("Settings");
  const [data] = useLoad<S>("staff/settings");
  const [f, setF] = useState<S | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return <p className="muted">Loading…</p>;
  const bind = (k: keyof S) => ({ value: String(f[k] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }) });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try { setF(await api<S>("staff/settings", { method: "PUT", body: f })); setMsg({ ok: true, text: "Settings saved." }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  return (
    <form onSubmit={save} className="stack" style={{ maxWidth: 900, ["--gap" as string]: "18px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <section className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Bank / payment details <span className="muted small">(printed on invoices)</span></h3>
        <div className="form-grid">
          <label className="field">Bank<input {...bind("bank_name")} placeholder="e.g. Meezan Bank" /></label>
          <label className="field">Account title<input {...bind("account_title")} /></label>
          <label className="field">Account number<input {...bind("account_number")} /></label>
          <label className="field">IBAN<input {...bind("iban")} /></label>
        </div>
        <label className="field">Other ways to pay<input {...bind("other_payment")} placeholder="JazzCash / Easypaisa: 0300 6666190" /></label>
      </section>
      <section className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Email &amp; SMS</h3>
        <p className="muted small">Email service: <b>{f.providers.email}</b> · SMS service: <b>{f.providers.sms}</b>. {f.providers.email === "console" && "Emails are only written to the server log until an email service is connected."} {f.providers.sms === "console" && "SMS is not connected yet."}</p>
        <div className="row"><label className="check"><input type="checkbox" checked={f.email_enabled} onChange={(e) => setF({ ...f, email_enabled: e.target.checked })} /> Send emails to clients</label>
          <label className="check"><input type="checkbox" checked={f.sms_enabled} onChange={(e) => setF({ ...f, sms_enabled: e.target.checked })} /> Send SMS to clients</label></div>
        <div className="form-grid">
          <label className="field">Reminder before due date (days)<input type="number" min={0} max={30} {...bind("remind_days_before")} /></label>
          <label className="field">Repeat overdue reminder every (days)<input type="number" min={1} max={60} {...bind("overdue_repeat_days")} /></label>
        </div>
      </section>
      <section className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Numbering</h3>
        <div className="form-grid">
          <label className="field">First invoice number each year<input type="number" min={1} {...bind("invoice_start")} /></label>
          <label className="field">First proposal number each year<input type="number" min={1} {...bind("proposal_start")} /></label>
          <label className="field">First internship certificate number<input type="number" min={1} {...bind("certificate_start")} /></label>
          <label className="field">…in the year<input type="number" min={2020} {...bind("certificate_start_year")} /></label>
        </div>
        <p className="muted small">Numbers look like XN-INV-2026-0335. Certificates look like XN-INT-2026-0101 (first number applies in the year shown; later years start at 0001). If documents already exist, numbering continues after the highest one.</p>
      </section>
      <section className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Certificate signatures <span className="muted small">(printed on every certificate)</span></h3>
        <p className="muted small">Upload each signature as a PNG with a transparent or white background. It is printed as it is: not redrawn or recoloured.</p>
        <div className="form-grid">
          {([["ceo_signature", "CEO (Muhammad Adnan)"], ["hr_signature", "HR Department"]] as const).map(([k, label]) => (
            <div key={k} className="field">{label}
              <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", borderRadius: 10, border: "1px solid var(--line)" }}>
                {f[k] ? <img src={f[k]} alt={`${label} signature`} style={{ maxHeight: 76, maxWidth: "90%" }} /> : <span className="muted small" style={{ color: "#777" }}>No signature yet</span>}
              </div>
              <div className="row">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  try { setF({ ...f, [k]: await readSignature(file) }); } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
                }} />
                {f[k] && <button type="button" className="link danger small" onClick={() => setF({ ...f, [k]: "" })}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
        <p className="muted small">Press <b>Save settings</b> below after choosing the files.</p>
      </section>
      <section className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Default terms</h3>
        <label className="field">Proposal terms<textarea rows={4} {...bind("proposal_terms")} /></label>
        <label className="field">Invoice terms<textarea rows={3} {...bind("invoice_terms")} /></label>
      </section>
      <div><button className="btn">Save settings</button></div>
    </form>
  );
}
