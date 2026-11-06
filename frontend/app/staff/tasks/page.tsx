"use client";
import Link from "next/link";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import type { T } from "@/components/panel/TaskForm";
import { Empty, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdate } from "@/lib/format";

export default function MyTasks() {
  useTitle("My tasks");
  const [show, setShow] = useState("open");
  const [rows, reload] = useLoad<T[]>(`staff/tasks?mine=1${show === "done" ? "&status=done" : ""}`, [show]);
  const list = rows?.filter((t) => (show === "open" ? t.status !== "done" : true));
  async function set(t: T, status: string) { await api(`staff/tasks/${t.id}`, { method: "PATCH", body: { status } }); reload(); }
  return (
    <>
      <div className="toolbar"><div className="filters"><select value={show} onChange={(e) => setShow(e.target.value)}><option value="open">Open tasks</option><option value="done">Done</option></select></div></div>
      {list && !list.length ? <Empty>No tasks here.</Empty> : (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Task</th><th>Project</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>{list?.map((t) => (
            <tr key={t.id}>
              <td><b>{t.title}</b>{t.priority === "high" && <> <span className="pill st-overdue">High</span></>}{t.description && <><br /><span className="muted small">{t.description}</span></>}</td>
              <td><Link href={`/staff/projects/${t.project}`} className="link">{t.project_title}</Link></td>
              <td>{fdate(t.due_date)}</td>
              <td><Status s={t.status} /></td>
              <td><select value={t.status} onChange={(e) => set(t, e.target.value)} aria-label="Change status" style={{ width: 140 }}><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option></select></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
