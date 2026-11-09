"use client";
import { useEffect, useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Flash, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";

type WP = { first_name: string; last_name: string; phone: string; email: string; position_title: string; city: string; skills: string; about: string;
  portfolio_url: string; status: string; payout_method: string; payout_name: string; payout_number: string; payout_bank: string };

export default function RemoteProfile() {
  useTitle("Profile & payout");
  const [data] = useLoad<WP>("remote/profile");
  const [f, setF] = useState<WP | null>(null);
  const [pw, setPw] = useState({ current: "", new: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return <p className="muted">Loading…</p>;
  const bind = (k: keyof WP) => ({ value: f[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { email: _e, position_title: _p, status: _s, ...body } = f!;   // eslint-disable-line @typescript-eslint/no-unused-vars
      setF(await api<WP>("remote/profile", { method: "PATCH", body }));
      setMsg({ ok: true, text: "Saved." });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    try { await api("auth/password/change", { body: pw }); setPw({ current: "", new: "" }); setMsg({ ok: true, text: "Password changed." }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <div className="stack" style={{ maxWidth: 720, ["--gap" as string]: "18px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <form onSubmit={save} className="stack" style={{ ["--gap" as string]: "18px" }}>
        <section className="panel stack">
          <h3 className="panel-title" style={{ margin: 0 }}>Payout details</h3>
          <p className="muted small" style={{ margin: 0 }}>Where we send your money. Use an account in your own name.</p>
          <div className="form-grid">
            <label className="field">Method<select {...bind("payout_method")}><option value="">Choose…</option><option value="jazzcash">JazzCash</option><option value="easypaisa">Easypaisa</option><option value="bank">Bank account</option></select></label>
            <label className="field">Account holder name<input {...bind("payout_name")} /></label>
            <label className="field">{f.payout_method === "bank" ? "Account number / IBAN" : "Mobile number"}<input {...bind("payout_number")} placeholder={f.payout_method === "bank" ? "PK00 XXXX …" : "03xx xxxxxxx"} /></label>
            {f.payout_method === "bank" && <label className="field">Bank name<input {...bind("payout_bank")} /></label>}
          </div>
        </section>
        <section className="panel stack">
          <h3 className="panel-title" style={{ margin: 0 }}>About you</h3>
          <p className="muted small" style={{ margin: 0 }}>Login email: <b>{f.email}</b>{f.position_title ? <> · Position: <b>{f.position_title}</b></> : null}</p>
          <div className="form-grid">
            <label className="field">First name<input {...bind("first_name")} /></label>
            <label className="field">Last name<input {...bind("last_name")} /></label>
            <label className="field">Mobile / WhatsApp<input {...bind("phone")} /></label>
            <label className="field">City<input {...bind("city")} /></label>
          </div>
          <label className="field">Skills<input {...bind("skills")} /></label>
          <label className="field">Portfolio link<input type="url" {...bind("portfolio_url")} /></label>
          <label className="field">About<textarea rows={3} {...bind("about")} /></label>
        </section>
        <div><button className="btn">Save</button></div>
      </form>
      <form onSubmit={savePw} className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Change password</h3>
        <label className="field">Current password<input type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
        <label className="field">New password<input type="password" required minLength={8} value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} /></label>
        <div><button className="btn btn-sm">Change password</button></div>
      </form>
    </div>
  );
}
