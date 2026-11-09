"use client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useRemoteInfo } from "../CareersClient";

const empty = { name: "", email: "", phone: "", city: "", position: "", skills: "", portfolio_url: "", about: "", password: "", agree: false };

export default function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { info, err: loadErr } = useRemoteInfo();
  const [f, setF] = useState({ ...empty, position: params.get("position") || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setErrors({});
    try {
      await api("public/remote/join", { body: f });
      router.replace("/remote?welcome=1");
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object" && !("detail" in (e.data as object))) setErrors(Object.fromEntries(Object.entries(e.data as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)])));
      else setErr((e as Error).message);
      setBusy(false);
    }
  }
  const E = ({ k }: { k: string }) => (errors[k] ? <small className="err-text">{errors[k]}</small> : null);

  if (info && !info.signup_open) return <p className="note err">We are not taking new remote workers right now. Please check again soon.</p>;
  return (
    <form onSubmit={submit} className="card card-pad stack">
      {loadErr && <p className="note err">{loadErr}</p>}
      <div className="form-grid">
        <label className="field">Full name *<input required value={f.name} onChange={set("name")} autoComplete="name" /><E k="name" /></label>
        <label className="field">Email *<input required type="email" value={f.email} onChange={set("email")} autoComplete="email" /><E k="email" /></label>
        <label className="field">Mobile / WhatsApp *<input required value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="03xx xxxxxxx" /><E k="phone" /></label>
        <label className="field">City<input value={f.city} onChange={set("city")} /></label>
      </div>
      <label className="field">Position
        <select value={f.position} onChange={set("position")}>
          <option value="">Any / not sure</option>
          {info?.positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select><E k="position" />
      </label>
      <label className="field">Your skills<input value={f.skills} onChange={set("skills")} placeholder="e.g. Canva, CapCut, English writing, Excel" /></label>
      <label className="field">Portfolio / sample link <small>(optional)</small><input type="url" value={f.portfolio_url} onChange={set("portfolio_url")} placeholder="https://" /></label>
      <label className="field">About you <small>(optional)</small><textarea rows={3} value={f.about} onChange={set("about")} /></label>
      <label className="field">Choose a password *<input required type="password" minLength={8} value={f.password} onChange={set("password")} autoComplete="new-password" /><E k="password" /></label>
      <label className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap", ["--gap" as string]: "10px" }}>
        <input type="checkbox" checked={f.agree} onChange={set("agree")} style={{ marginTop: 4 }} />
        <span className="small">I agree to do my own original work, keep client information private, and understand that coins are paid only for work Xeon Net approves. Joining is free.</span>
      </label>
      <E k="agree" />
      {err && <p className="note err">{err}</p>}
      <div className="row"><button className="btn" disabled={busy}>{busy ? "Creating your account…" : "Join free"} <ArrowRight /></button>
        <span className="muted small">Already joined? <Link className="link" href="/login?next=/remote">Log in</Link></span></div>
    </form>
  );
}
