"use client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { Coins, KIND_LABEL, rs, SubStatus, type RSub, type RTask, type RWithdrawal } from "@/components/panel/remote";
import { Empty, useLoad } from "@/components/panel/ui";
import { fdate, fdatetime } from "@/lib/format";

type Home = {
  balance: number; balance_rupees: string; earned: number; paid_rupees: string; coin_value: string; min_withdraw_coins: number;
  pending_reviews: number; approved: number; pending_withdrawal: RWithdrawal | null; status: string; position: string;
  new_tasks: RTask[]; recent: RSub[]; payout_ready: boolean;
};

function Welcome() {
  const welcome = useSearchParams().get("welcome");
  if (!welcome) return null;
  return (
    <div className="alert alert-ok">
      <b>Welcome to Xeon Net remote work!</b> Your account is ready. Pick a task below, send your work, and earn coins when it is approved.
      Add your JazzCash / Easypaisa / bank details in <Link className="link" href="/remote/profile">Profile &amp; payout</Link> so you can withdraw.
    </div>
  );
}

export default function RemoteHome() {
  const { me } = useMe();
  useTitle("Dashboard");
  const [h, , err] = useLoad<Home>("remote/home");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!h) return <p className="muted">Loading…</p>;
  return (
    <div className="stack" style={{ ["--gap" as string]: "24px" }}>
      <Suspense fallback={null}><Welcome /></Suspense>
      <div><h2 className="h3">Hi {me.first_name || me.name}</h2><p className="muted small">{h.position ? `${h.position} · ` : ""}1 coin = {rs(h.coin_value)}</p></div>
      {h.status !== "active" && <p className="alert alert-err">Your account is paused, so you cannot send new work or withdraw. Please contact Xeon Net on WhatsApp.</p>}
      <div className="split split-even">
        <div className="coin-card">
          <span className="muted small">Wallet balance</span>
          <b>{h.balance.toLocaleString()} coins</b>
          <span>= {rs(h.balance_rupees)}</span>
          <div className="row" style={{ marginTop: 8 }}>
            <Link href="/remote/wallet" className="btn btn-dark btn-sm">{h.balance >= h.min_withdraw_coins ? "Withdraw" : "Open wallet"}</Link>
            {h.balance < h.min_withdraw_coins && <span className="small">{(h.min_withdraw_coins - h.balance).toLocaleString()} more coins to withdraw</span>}
          </div>
        </div>
        <div className="kpis" style={{ alignContent: "start" }}>
          <div className="kpi"><b>{h.earned.toLocaleString()}</b><span>Coins earned</span></div>
          <div className="kpi"><b>{h.approved}</b><span>Tasks approved</span></div>
          <div className="kpi"><b>{h.pending_reviews}</b><span>Waiting for review</span></div>
          <div className="kpi"><b>{rs(h.paid_rupees)}</b><span>Paid to you</span></div>
        </div>
      </div>
      {h.pending_withdrawal && <p className="alert">Withdrawal of <b>{h.pending_withdrawal.coins.toLocaleString()} coins ({rs(h.pending_withdrawal.amount)})</b> requested on {fdate(h.pending_withdrawal.created_at)}. We will send it to your {h.pending_withdrawal.method_label}.</p>}
      {!h.payout_ready && <p className="alert">Add your payout details in <Link className="link" href="/remote/profile">Profile &amp; payout</Link> before your first withdrawal.</p>}
      <section className="panel">
        <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>New tasks for you</h3><Link className="link small" href="/remote/tasks">All tasks →</Link></div>
        {h.new_tasks.length ? (
          <div className="grid" style={{ ["--min" as string]: "260px", marginTop: 12 }}>
            {h.new_tasks.map((t) => (
              <Link key={t.id} href={`/remote/tasks/${t.id}`} className="card card-pad task-card">
                <div className="row between"><span className="pill">{KIND_LABEL[t.kind] || t.kind}</span><Coins n={t.coins} /></div>
                <b>{t.title}</b>
                <span className="muted small">{t.deadline ? `Due ${fdatetime(t.deadline)}` : "No deadline"}{t.places_left != null ? ` · ${t.places_left} place${t.places_left === 1 ? "" : "s"} left` : ""}</span>
                <span className="link small">Open task <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        ) : <Empty>No new tasks right now. We add tasks often; you also get a notification on the Xeon Net app.</Empty>}
      </section>
      {h.recent.length > 0 && (
        <section className="panel">
          <div className="row between"><h3 className="panel-title" style={{ margin: 0 }}>Recent work</h3><Link className="link small" href="/remote/submissions">All →</Link></div>
          <table className="tbl" style={{ marginTop: 10 }}><tbody>
            {h.recent.map((r) => <tr key={r.id}><td><Link href={`/remote/tasks/${r.task}`}><b>{r.task_title}</b></Link><br /><span className="muted small">{fdate(r.created_at)}</span></td>
              <td className="r">{r.status === "approved" ? <span className="plus">+{r.coins}</span> : <Coins n={r.task_coins} />}<br /><SubStatus s={r.status} /></td></tr>)}
          </tbody></table>
        </section>
      )}
    </div>
  );
}
