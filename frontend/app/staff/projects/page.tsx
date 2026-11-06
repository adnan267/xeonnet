"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import ProjectForm, { type P } from "@/components/panel/ProjectForm";
import { Empty, Progress, Status, useLoad } from "@/components/panel/ui";
import { fdate } from "@/lib/format";

export default function Projects() {
  useTitle("Projects");
  const { can } = useMe();
  const [status, setStatus] = useState("all");
  const [rows, reload] = useLoad<P[]>(`staff/projects?status=${status}`, [status]);
  const [edit, setEdit] = useState<Partial<P> | null>(null);
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All projects</option><option value="planning">Planning</option><option value="active">In progress</option><option value="review">In review</option><option value="hold">On hold</option><option value="done">Completed</option>
          </select>
        </div>
        {can("projects", true) && <button className="btn btn-sm" onClick={() => setEdit({})}><Plus /> New project</button>}
      </div>
      {rows && !rows.length ? <Empty>No projects yet.</Empty> : (
        <div className="grid" style={{ ["--min" as string]: "320px" }}>
          {rows?.map((p) => (
            <Link key={p.id} href={`/staff/projects/${p.id}`} className="panel stack" style={{ ["--gap" as string]: "10px" }}>
              <div className="row between"><Status s={p.status} />{p.due_date && <span className="muted small">Due {fdate(p.due_date)}</span>}</div>
              <h3 style={{ fontSize: 18 }}>{p.title}</h3>
              <p className="muted small">{p.client_name}{p.manager_detail && ` · Lead: ${p.manager_detail.name}`}</p>
              <Progress value={p.progress} />
              <p className="small muted">{p.progress}% · {p.task_counts.done}/{p.task_counts.todo + p.task_counts.doing + p.task_counts.done} tasks done</p>
            </Link>
          ))}
        </div>
      )}
      {edit && <ProjectForm initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </>
  );
}
