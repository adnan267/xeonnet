"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ message: string }>("public/subscribe", { body: { email } });
      setNote({ ok: true, text: r.message });
      setEmail("");
    } catch (err) {
      setNote({ ok: false, text: (err as Error).message });
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="stack" style={{ ["--gap" as string]: "8px" }}>
      <label className="field">Newsletter
        <span className="row" style={{ flexWrap: "nowrap", ["--gap" as string]: "8px" }}>
          <input type="email" required placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <button className="btn btn-sm" disabled={busy}>Join</button>
        </span>
      </label>
      <p className={`note ${note ? (note.ok ? "ok" : "err") : ""}`} aria-live="polite">{note?.text}</p>
    </form>
  );
}
