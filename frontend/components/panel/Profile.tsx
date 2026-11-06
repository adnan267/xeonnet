"use client";
import { useState } from "react";
import { useMe, useTitle } from "./AppShell";
import { Flash } from "./ui";
import { api } from "@/lib/api";

export default function Profile() {
  useTitle("My profile");
  const { me } = useMe();
  const [p, setP] = useState({ first_name: me.first_name, last_name: me.last_name, phone: me.phone });
  const [pw, setPw] = useState({ current: "", new: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    try { await api("auth/me", { method: "PATCH", body: p }); setMsg({ ok: true, text: "Profile saved." }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    try { await api("auth/password/change", { body: pw }); setPw({ current: "", new: "" }); setMsg({ ok: true, text: "Password changed." }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  return (
    <div className="stack" style={{ maxWidth: 640, ["--gap" as string]: "18px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <form onSubmit={saveProfile} className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Your details</h3>
        <p className="muted small">Login email: <b>{me.email}</b></p>
        <div className="form-grid">
          <label className="field">First name<input value={p.first_name} onChange={(e) => setP({ ...p, first_name: e.target.value })} /></label>
          <label className="field">Last name<input value={p.last_name} onChange={(e) => setP({ ...p, last_name: e.target.value })} /></label>
          <label className="field">Phone<input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></label>
        </div>
        <div><button className="btn btn-sm">Save</button></div>
      </form>
      <form onSubmit={savePw} className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Change password</h3>
        <label className="field">Current password<input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
        <label className="field">New password<input type="password" required minLength={8} autoComplete="new-password" value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} /></label>
        <div><button className="btn btn-sm">Change password</button></div>
      </form>
    </div>
  );
}
