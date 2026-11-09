"use client";
import { ArrowRight, BadgeCheck, Coins, ListChecks, Send, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Position = { id: number; title: string; slug: string; category: string; summary: string; description: string; requirements: string };
export type RemoteInfo = { signup_open: boolean; coin_value: string; min_withdraw_coins: number; min_withdraw_rupees: string; payout_days: string; positions: Position[]; open_tasks: number };

export const rs = (v: string | number) => `Rs ${Number(v).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

export function useRemoteInfo() {
  const [info, setInfo] = useState<RemoteInfo | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<RemoteInfo>("public/remote").then(setInfo).catch((e) => setErr(e.message)); }, []);
  return { info, err };
}

const STEPS = [
  { icon: BadgeCheck, title: "Join free", text: "Fill in a short form. Your account is ready straight away. No fee, no deposit." },
  { icon: ListChecks, title: "Pick a task", text: "See tasks for your role: writing, design, video, social media, research and more." },
  { icon: Send, title: "Send your work", text: "Upload a link or write what you did. Our team checks it, usually within a day." },
  { icon: Coins, title: "Earn coins", text: "Every approved task adds coins to your wallet. If changes are needed, you can send it again." },
  { icon: Wallet, title: "Withdraw", text: "Turn coins into money and get paid by JazzCash, Easypaisa or bank transfer." },
];

export default function CareersClient() {
  const { info, err } = useRemoteInfo();
  const value = info ? Number(info.coin_value) : 0;
  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">How it works</span><h2>Five simple steps</h2></div>
          <div className="grid" style={{ ["--min" as string]: "200px" }}>
            {STEPS.map((s, i) => (
              <div key={s.title} className="card card-pad stack" style={{ ["--gap" as string]: "12px" }}>
                <div className="row" style={{ justifyContent: "space-between" }}><span className="icon-box"><s.icon /></span><span className="pill">Step {i + 1}</span></div>
                <h3 className="h3">{s.title}</h3>
                <p className="muted small">{s.text}</p>
              </div>
            ))}
          </div>
          {info && (
            <div className="card card-pad row" style={{ marginTop: 24, justifyContent: "space-between", ["--gap" as string]: "16px 32px" }}>
              <div><span className="muted small">Coin value</span><h3 className="h3">1 coin = {rs(value)}</h3></div>
              <div><span className="muted small">Example</span><h3 className="h3">1,000 coins = {rs(1000 * value)}</h3></div>
              <div><span className="muted small">Minimum withdrawal</span><h3 className="h3">{info.min_withdraw_coins.toLocaleString()} coins ({rs(info.min_withdraw_rupees)})</h3></div>
              <div><span className="muted small">Payment</span><h3 className="h3">{info.payout_days}</h3></div>
            </div>
          )}
        </div>
      </section>

      <section className="section section-alt" id="positions">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Open positions</span><h2>Choose your role</h2>
            <p className="muted">Each task shows how many coins it pays before you start.</p></div>
          {err && <p className="note err">{err}</p>}
          {!info && !err && <p className="muted">Loading positions…</p>}
          {info && !info.signup_open && <p className="note err">We are not taking new remote workers right now. Please check again soon.</p>}
          <div className="grid" style={{ ["--min" as string]: "300px" }}>
            {info?.positions.map((p) => (
              <article key={p.id} className="card card-pad stack" style={{ ["--gap" as string]: "12px" }}>
                {p.category && <span className="pill" style={{ alignSelf: "flex-start" }}>{p.category}</span>}
                <h3 className="h3">{p.title}</h3>
                <p className="muted">{p.summary}</p>
                {p.requirements && <ul className="check-list small">{p.requirements.split("\n").filter(Boolean).map((r) => <li key={r}><ShieldCheck />{r}</li>)}</ul>}
                <div className="grow" />
                {info.signup_open && <Link className="btn btn-sm" style={{ alignSelf: "flex-start" }} href={`/careers/join?position=${p.id}`}>Apply for this role <ArrowRight /></Link>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap hero-grid" style={{ alignItems: "start", gap: 48 }}>
          <div className="stack" style={{ ["--gap" as string]: "16px" }}>
            <span className="eyebrow">Our promise</span>
            <h2 className="h2">Fair and simple</h2>
            <ul className="check-list">
              <li><ShieldCheck />Joining is free. We never ask for a fee, deposit or “activation” payment.</li>
              <li><ShieldCheck />You are paid only for real work that our team approves.</li>
              <li><ShieldCheck />The coins for a task are shown before you start.</li>
              <li><ShieldCheck />Every coin is listed in your wallet with the task it came from.</li>
              <li><ShieldCheck />Anyone asking you to pay to join “Xeon Net” is not us. Please report it.</li>
            </ul>
          </div>
          <div className="card card-pad stack" style={{ ["--gap" as string]: "14px" }}>
            <h3 className="h3">Ready to start?</h3>
            <p className="muted">It takes two minutes. Already joined? Log in to see your tasks.</p>
            <div className="row">
              {info?.signup_open !== false && <Link className="btn" href="/careers/join">Join free <ArrowRight /></Link>}
              <Link className="btn btn-ghost" href="/login?next=/remote">Log in</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
