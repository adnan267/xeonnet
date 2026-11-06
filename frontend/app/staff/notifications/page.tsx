"use client";
import { useTitle } from "@/components/panel/AppShell";
import { Empty, Status, useLoad } from "@/components/panel/ui";
import { fdatetime } from "@/lib/format";

type L = { id: number; kind: string; channel: string; to: string; subject: string; status: string; error: string; created_at: string; document: string; client: string };

export default function Notifications() {
  useTitle("Emails & SMS");
  const [rows] = useLoad<L[]>("staff/notifications");
  return (
    <>
      <p className="muted small" style={{ marginBottom: 16 }}>Every email and SMS sent to clients: invoices, proposals, receipts, reminders and portal invitations. Reminders are sent automatically every morning.</p>
      {rows && !rows.length ? <Empty>Nothing sent yet.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>When</th><th>Type</th><th>To</th><th>Document</th><th>Status</th></tr></thead>
          <tbody>{rows?.map((l) => (
            <tr key={l.id}>
              <td>{fdatetime(l.created_at)}</td>
              <td>{l.channel.toUpperCase()} · {l.kind.replace(/_/g, " ")}</td>
              <td>{l.client}<br /><span className="muted small">{l.to}</span></td>
              <td>{l.document}</td>
              <td><Status s={l.status === "sent" ? "ok" : "failed"} />{l.error && <><br /><span className="small" style={{ color: "var(--bad)" }}>{l.error}</span></>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
