"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import ProjectForm, { type P } from "@/components/panel/ProjectForm";
import TaskForm, { type T } from "@/components/panel/TaskForm";
import { Progress, Status, useLoad } from "@/components/panel/ui";
import { api } from "@/lib/api";
import { fdate, fdatetime } from "@/lib/format";

type U = { id: number; author_name: string; text: string; visible_to_client: boolean; created_at: string };
const COLS = [["todo", "To do"], ["doing", "In progress"], ["done", "Done"]] as const;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { me, can } = useMe();
  const [p, reloadP, err] = useLoad<P>(`staff/projects/${id}`);
  const [tasks, reloadT] = useLoad<T[]>(`staff/tasks?project=${id}`);
  const [updates, , , setUpdates] = useLoad<U[]>(`staff/projects/${id}/updates`);
  const [editP, setEditP] = useState(false);
  const [task, setTask] = useState<(Partial<T> & { project: number }) | null>(null);
  const [text, setText] = useState("");
  const [shareUpdate, setShareUpdate] = useState(true);
  useTitle(p?.title || "Project");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (!p) return <p className="muted">Loading…</p>;

  const canEditTask = (t: T) => can("tasks", true) && (me.role !== "staff" || t.assignee === me.id || p.members.includes(me.id) || p.manager === me.id);
  async function move(t: T, status: string) { await api(`staff/tasks/${t.id}`, { method: "PATCH", body: { status } }); reloadT(); reloadP(); }
  async function post(e: React.FormEvent) {
    e.preventDefault();
    setUpdates(await api<U[]>(`staff/projects/${id}/updates`, { body: { text, visible_to_client: shareUpdate } }));
    setText("");
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "20px" }}>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <Link href="/staff/projects" className="btn btn-ghost btn-sm">← Projects</Link>
        <div className="row">
          {can("documents", true) && <Link className="btn btn-ghost btn-sm" href={`/staff/documents/new?type=invoice&client=${p.client}`}>Invoice this client</Link>}
          {can("projects", true) && <button className="btn btn-ghost btn-sm" onClick={() => setEditP(true)}>Edit project</button>}
          {can("tasks", true) && <button className="btn btn-sm" onClick={() => setTask({ project: p.id })}><Plus /> Add task</button>}
        </div>
      </div>
      <section className="panel stack" style={{ ["--gap" as string]: "10px" }}>
        <div className="row between"><div className="row"><Status s={p.status} /><span className="muted small">{p.client_name}</span>{!p.visible_to_client && <span className="pill">Hidden from client</span>}</div>
          <span className="muted small">{p.start_date && `Start ${fdate(p.start_date)}`}{p.due_date && ` · Deadline ${fdate(p.due_date)}`}</span></div>
        {p.description && <p className="muted" style={{ whiteSpace: "pre-line" }}>{p.description}</p>}
        <Progress value={p.progress} /><span className="small muted">{p.progress}% complete</span>
        <div className="row small">{p.manager_detail && <span className="tag">Lead: {p.manager_detail.name}</span>}{p.members_detail.map((m) => <span key={m.id} className="tag">{m.name}</span>)}</div>
      </section>
      <div className="kanban">
        {COLS.map(([key, label]) => (
          <div key={key} className="col">
            <b className="small" style={{ padding: "2px 4px" }}>{label} · {tasks?.filter((t) => t.status === key).length ?? 0}</b>
            {tasks?.filter((t) => t.status === key).map((t) => (
              <div key={t.id} className="task">
                <div className="row between"><b style={{ fontSize: 15 }}>{t.title}</b>{t.priority === "high" && <span className="pill st-overdue">High</span>}</div>
                {t.description && <p className="muted small">{t.description}</p>}
                <span className="muted small">{t.assignee_detail?.name || "Unassigned"}{t.due_date && ` · ${fdate(t.due_date)}`}</span>
                {canEditTask(t) && (
                  <div className="row" style={{ ["--gap" as string]: "8px" }}>
                    {COLS.filter(([k]) => k !== t.status).map(([k, l]) => <button key={k} className="btn btn-ghost btn-xs" onClick={() => move(t, k)}>→ {l}</button>)}
                    <button className="link small" onClick={() => setTask(t)}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <section className="panel stack">
        <h3 className="panel-title" style={{ margin: 0 }}>Updates</h3>
        {can("tasks", true) && (
          <form onSubmit={post} className="stack" style={{ ["--gap" as string]: "10px" }}>
            <textarea required rows={3} placeholder="Post a progress update…" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="row between"><label className="check"><input type="checkbox" checked={shareUpdate} onChange={(e) => setShareUpdate(e.target.checked)} /> Show to client</label><button className="btn btn-sm">Post update</button></div>
          </form>
        )}
        {updates?.map((u) => (
          <div key={u.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <p className="small muted"><b style={{ color: "var(--text)" }}>{u.author_name}</b> · {fdatetime(u.created_at)}{!u.visible_to_client && " · internal"}</p>
            <p style={{ whiteSpace: "pre-line" }}>{u.text}</p>
          </div>
        ))}
        {updates && !updates.length && <p className="muted small">No updates yet.</p>}
      </section>
      {editP && <ProjectForm initial={p} onClose={() => setEditP(false)} onSaved={() => { setEditP(false); reloadP(); }} />}
      {task && <TaskForm initial={task} onClose={() => setTask(null)} onSaved={() => { setTask(null); reloadT(); reloadP(); }} />}
    </div>
  );
}
