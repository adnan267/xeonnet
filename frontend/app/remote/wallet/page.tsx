"use client";
import Link from "next/link";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { rs, WdStatus, type REntry, type RWithdrawal } from "@/components/panel/remote";
import { Empty, Flash, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdate, fdatetime } from "@/lib/format";

type Wallet = {
  balance: number; balance_rupees: string; coin_value: string; min_withdraw_coins: number; payout_days: string;
  payout: { method: string; method_label: string; name: string; number: string; bank: string };
  entries: REntry[]; withdrawals: RWithdrawal[];
};

export default function WalletPage() {
  useTitle("Wallet");
  const [w, reload, err] = useLoad<Wallet>("remote/wallet");
  const [coins, setCoins] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!w) return <p className="muted">Loading…</p>;
  const n = Math.floor(Number(coins) || 0);
  const pending = w.withdrawals.find((x) => x.status === "pending");
  const ready = !!(w.payout.method && w.payout.number);

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<RWithdrawal>("remote/wallet", { body: { coins: n } });
      setCoins(""); reload();
      setMsg({ ok: true, text: `Requested ${rs(r.amount)}. We will send it to your ${r.method_label} ${w!.payout_days}.` });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "24px" }}>
      <Flash msg={msg} onDone={() => setMsg(null)} />
      <div className="split split-even">
        <div className="coin-card">
          <span className="muted small">Balance</span>
          <b>{w.balance.toLocaleString()} coins</b>
          <span>= {rs(w.balance_rupees)} · 1 coin = {rs(w.coin_value)}</span>
        </div>
        <form onSubmit={withdraw} className="panel stack">
          <h3 className="panel-title" style={{ margin: 0 }}>Withdraw</h3>
          {pending ? <p className="alert" style={{ margin: 0 }}>Your request for {pending.coins.toLocaleString()} coins ({rs(pending.amount)}) is being processed.</p>
            : !ready ? <p className="alert" style={{ margin: 0 }}>Add your JazzCash / Easypaisa / bank details in <Link className="link" href="/remote/profile">Profile &amp; payout</Link> first.</p>
            : <>
              <p className="muted small" style={{ margin: 0 }}>To: <b>{w.payout.method_label}</b> · {w.payout.name} · {w.payout.number}{w.payout.bank ? ` · ${w.payout.bank}` : ""}</p>
              <label className="field">Coins (minimum {w.min_withdraw_coins.toLocaleString()})
                <input type="number" min={w.min_withdraw_coins} max={w.balance} step={1} value={coins} onChange={(e) => setCoins(e.target.value)} />
              </label>
              <div className="row between">
                <span className="small">You get <b>{rs(n * Number(w.coin_value))}</b></span>
                <button type="button" className="link small" onClick={() => setCoins(String(w.balance))}>Use all</button>
              </div>
              <div><button className="btn" disabled={busy || n < w.min_withdraw_coins || n > w.balance}>{busy ? "Requesting…" : "Request payment"}</button></div>
              <p className="muted small" style={{ margin: 0 }}>Paid {w.payout_days}.</p>
            </>}
        </form>
      </div>

      <section className="panel">
        <h3 className="panel-title">Withdrawals</h3>
        {w.withdrawals.length ? <table className="tbl"><tbody>
          {w.withdrawals.map((x) => <tr key={x.id}>
            <td><b>{rs(x.amount)}</b> <span className="muted small">({x.coins.toLocaleString()} coins)</span><br /><span className="muted small">{x.method_label} · {x.account_number} · {fdate(x.created_at)}</span>
              {x.reference && <><br /><span className="small">Transaction ID: <b>{x.reference}</b></span></>}{x.staff_note && <><br /><span className="small">Note: {x.staff_note}</span></>}</td>
            <td className="r"><WdStatus s={x.status} /></td>
          </tr>)}
        </tbody></table> : <Empty>No withdrawals yet.</Empty>}
      </section>

      <section className="panel">
        <h3 className="panel-title">Coin history</h3>
        {w.entries.length ? <table className="tbl"><tbody>
          {w.entries.map((e) => <tr key={e.id}><td>{e.note || e.kind_label}<br /><span className="muted small">{e.kind_label} · {fdatetime(e.created_at)}</span></td>
            <td className="r"><span className={e.coins > 0 ? "plus" : "minus"}>{e.coins > 0 ? "+" : ""}{e.coins.toLocaleString()}</span></td></tr>)}
        </tbody></table> : <Empty>Coins you earn appear here.</Empty>}
      </section>
    </div>
  );
}
