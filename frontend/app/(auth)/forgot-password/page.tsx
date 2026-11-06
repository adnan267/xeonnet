"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await api("auth/password/forgot", { body: { email } }); } catch { /* same message either way */ }
    setDone(true); setBusy(false);
  }
  return (
    <form onSubmit={submit} className="stack" style={{ ["--gap" as string]: "16px" }}>
      <h1 className="h3">Reset password</h1>
      {done ? <p className="alert alert-ok">If an account exists for {email}, we have emailed a link to choose a new password.</p> : <>
        <p className="muted small">Enter your email and we will send you a link.</p>
        <label className="field">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="btn" disabled={busy}>Send link</button>
      </>}
      <Link href="/login" className="link small">← Back to login</Link>
    </form>
  );
}
