"use client";
import { Send } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";

const empty = { name: "", email: "", phone: "", service: "", budget: "", message: "", website: "" };

export default function ContactForm({ services }: { services: string[] }) {
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ message: string }>("public/contact", { body: f });
      setNote({ ok: true, text: r.message });
      setF(empty);
    } catch (err) {
      setNote({ ok: false, text: err instanceof ApiError && err.status === 429 ? "Too many messages, please try again later or WhatsApp us." : (err as Error).message });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card card-pad stack reveal" noValidate={false}>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} />
      <div className="form-grid">
        <label className="field">Name<input required minLength={2} maxLength={120} autoComplete="name" value={f.name} onChange={set("name")} /></label>
        <label className="field">Email<input type="email" required maxLength={160} autoComplete="email" value={f.email} onChange={set("email")} /></label>
        <label className="field">Phone / WhatsApp<input maxLength={40} autoComplete="tel" value={f.phone} onChange={set("phone")} /></label>
        <label className="field">Service
          <select value={f.service} onChange={set("service")}><option value="">Choose…</option>{services.map((s) => <option key={s}>{s}</option>)}<option>Other</option></select>
        </label>
      </div>
      <label className="field">Budget <small>(optional)</small>
        <select value={f.budget} onChange={set("budget")}><option value="">Prefer not to say</option><option>Under PKR 50,000</option><option>PKR 50,000 – 150,000</option><option>PKR 150,000 – 500,000</option><option>Above PKR 500,000</option><option>International (GBP / USD)</option></select>
      </label>
      <label className="field">Message<textarea required minLength={10} rows={6} value={f.message} onChange={set("message")} placeholder="Tell us about your project…" /></label>
      <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send message"} <Send /></button>
      <p className={`note ${note ? (note.ok ? "ok" : "err") : ""}`} aria-live="polite">{note?.text}</p>
    </form>
  );
}
