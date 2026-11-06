"use client";
import Link from "next/link";
import { useTitle } from "@/components/panel/AppShell";
import type { P } from "@/components/panel/ProjectForm";
import { Empty, Progress, Status, useLoad } from "@/components/panel/ui";
import { fdate } from "@/lib/format";

export default function PortalProjects() {
  useTitle("My projects");
  const [rows] = useLoad<P[]>("portal/projects");
  if (rows && !rows.length) return <Empty>No projects yet.</Empty>;
  return (
    <div className="grid" style={{ ["--min" as string]: "320px" }}>
      {rows?.map((p) => (
        <Link key={p.id} href={`/portal/projects/${p.id}`} className="panel stack" style={{ ["--gap" as string]: "10px" }}>
          <div className="row between"><Status s={p.status} />{p.due_date && <span className="muted small">Deadline {fdate(p.due_date)}</span>}</div>
          <h3 style={{ fontSize: 18 }}>{p.title}</h3>
          <Progress value={p.progress} /><span className="muted small">{p.progress}% complete{p.manager_detail && ` · Your contact: ${p.manager_detail.name}`}</span>
        </Link>
      ))}
    </div>
  );
}
