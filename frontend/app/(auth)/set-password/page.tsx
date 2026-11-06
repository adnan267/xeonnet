"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";

function SetPasswordForm() {
  const p = useSearchParams();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return setErr("The two passwords do not match.");
    setBusy(true); setErr("");
    try {
      const me = await api<{ is_client: boolean }>("auth/password/set", { body: { uid: p.get("uid"), token: p.get("token"), password: pw } });
      router.replace(me.is_client ? "/portal" : "/staff");
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="stack" style={{ ["--gap" as string]: "16px" }}>
      <div><h1 className="h3">Choose your password</h1><p className="muted small">At least 8 characters. Avoid common passwords.</p></div>
      {err && <p className="alert alert-err">{err}</p>}
      <label className="field">New password<input type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label className="field">Repeat password<input type="password" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
      <button className="btn" disabled={busy}>Save and continue</button>
    </form>
  );
}

export default function SetPassword() {
  return <Suspense><SetPasswordForm /></Suspense>;
}
