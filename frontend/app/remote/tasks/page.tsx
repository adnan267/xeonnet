"use client";
import Link from "next/link";
import { useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { Coins, KIND_LABEL, SubStatus, type RTask } from "@/components/panel/remote";
import { Empty, useLoad } from "@/components/panel/ui";
import { fdatetime } from "@/lib/format";

export default function RemoteTasks() {
  useTitle("Tasks");
  const [show, setShow] = useState<"open" | "done">("open");
  const [rows, , err] = useLoad<RTask[]>(`remote/tasks?show=${show}`, [show]);
  return (
    <>
      <div className="toolbar"><div className="filters">
        <select value={show} onChange={(e) => setShow(e.target.value as "open" | "done")}><option value="open">Available tasks</option><option value="done">Tasks I sent</option></select>
      </div></div>
      {err && <p className="alert alert-err">{err}</p>}
      {rows && !rows.length ? <Empty>{show === "open" ? "No tasks available right now. Please check back soon." : "You have not sent any work yet."}</Empty> : (
        <div className="grid" style={{ ["--min" as string]: "280px" }}>
          {rows?.map((t) => (
            <Link key={t.id} href={`/remote/tasks/${t.id}`} className="card card-pad task-card">
              <div className="row between"><span className="pill">{KIND_LABEL[t.kind] || t.kind}</span><Coins n={t.coins} /></div>
              <b>{t.title}</b>
              <p className="muted small" style={{ margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.instructions}</p>
              <div className="row between"><span className="muted small">{t.deadline ? `Due ${fdatetime(t.deadline)}` : "No deadline"}{t.places_left != null ? ` · ${t.places_left} left` : ""}</span>{t.my_status && <SubStatus s={t.my_status} />}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
