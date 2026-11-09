"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { homeFor } from "@/components/panel/AppShell";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const home = (me: { is_client: boolean; is_remote?: boolean; is_student?: boolean }) => (next.startsWith("/") ? next : homeFor(me));
  useEffect(() => { api("auth/me").then((me) => router.replace(home(me))).catch(() => {}); }, []); // eslint-disable-line

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { const me = await api("auth/login", { body: { email, password } }); router.replace(home(me)); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="stack" style={{ ["--gap" as string]: "16px" }}>
      <div><h1 className="h3">Log in</h1><p className="muted small">Clients and Xeon Net team members.</p></div>
      {err && <p className="alert alert-err">{err}</p>}
      <label className="field">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="field">Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="btn" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <Link href="/forgot-password" className="link small">Forgot your password?</Link>
    </form>
  );
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>;
}
