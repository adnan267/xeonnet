"use client";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fdate } from "@/lib/format";

type Review = { id: number; name: string; role: string; rating: number; text: string; created_at: string };

export default function ReviewsClient() {
  const [data, setData] = useState<{ reviews: Review[]; count: number; average: number | null } | null>(null);
  const [form, setForm] = useState({ name: "", role: "", rating: 0, text: "", website: "" });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("public/reviews").then(setData).catch(() => setData({ reviews: [], count: 0, average: null })); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rating) return setNote({ ok: false, text: "Please choose a star rating." });
    setBusy(true);
    try {
      const r = await api<{ message: string }>("public/reviews", { body: form });
      setNote({ ok: true, text: r.message });
      setForm({ name: "", role: "", rating: 0, text: "", website: "" });
    } catch (err) { setNote({ ok: false, text: (err as Error).message }); } finally { setBusy(false); }
  }

  return (
    <section className="section">
      <div className="wrap split split-wide">
        <div className="stack" style={{ ["--gap" as string]: "16px" }}>
          {data?.average && <p className="h3">{data.average} / 5 <span className="muted small">from {data.count} reviews</span></p>}
          {data && data.reviews.length === 0 && <div className="card empty">No reviews yet. Be the first to share your experience.</div>}
          {data?.reviews.map((r) => (
            <figure key={r.id} className="card card-pad stack" style={{ margin: 0, ["--gap" as string]: "12px" }}>
              <span className="stars">{[1, 2, 3, 4, 5].map((i) => <Star key={i} fill={i <= r.rating ? "currentColor" : "none"} />)}</span>
              <blockquote style={{ margin: 0, fontSize: 17 }}>{r.text}</blockquote>
              <figcaption className="muted small"><b style={{ color: "var(--text)" }}>{r.name}</b>{r.role && ` · ${r.role}`} · {fdate(r.created_at)}</figcaption>
            </figure>
          ))}
        </div>
        <form onSubmit={submit} className="card card-pad stack" style={{ position: "sticky", top: 96 }}>
          <h2 className="h3">Write a review</h2>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <label className="field">Your name<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field">Company / role <small>(optional)</small><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></label>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ marginBottom: 6 }}>Rating</legend>
            <span className="stars" style={{ gap: 6 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" className="link" aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setForm({ ...form, rating: i })} style={{ color: "#F0A21F" }}>
                  <Star size={28} fill={i <= form.rating ? "currentColor" : "none"} />
                </button>
              ))}
            </span>
          </fieldset>
          <label className="field">Your review<textarea required minLength={10} rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
          <button className="btn" disabled={busy}>Submit review</button>
          <p className={`note ${note ? (note.ok ? "ok" : "err") : ""}`} aria-live="polite">{note?.text}</p>
        </form>
      </div>
    </section>
  );
}
