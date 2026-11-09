"use client";
import Link from "next/link";
import { useTitle } from "@/components/panel/AppShell";
import { Coins, SubStatus, type RSub } from "@/components/panel/remote";
import { Empty, useLoad } from "@/components/panel/ui";
import { fdatetime } from "@/lib/format";

export default function MyWork() {
  useTitle("My work");
  const [rows, , err] = useLoad<RSub[]>("remote/submissions");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (rows && !rows.length) return <Empty>You have not sent any work yet. <Link className="link" href="/remote/tasks">Find a task</Link></Empty>;
  return (
    <div className="table-wrap"><table className="tbl">
      <thead><tr><th>Task</th><th>Sent</th><th>Status</th><th className="r">Coins</th></tr></thead>
      <tbody>{rows?.map((r) => (
        <tr key={r.id}>
          <td><Link href={`/remote/tasks/${r.task}`}><b>{r.task_title}</b></Link>{r.review_note && <><br /><span className="muted small">Note: {r.review_note}</span></>}</td>
          <td className="small">{fdatetime(r.created_at)}</td>
          <td><SubStatus s={r.status} /></td>
          <td className="r">{r.status === "approved" ? <span className="plus">+{r.coins}</span> : <Coins n={r.task_coins} />}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}
