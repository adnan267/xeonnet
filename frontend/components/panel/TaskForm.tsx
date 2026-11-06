"use client";
import { useState } from "react";
import type { Person } from "./ProjectForm";
import { Modal, useLoad } from "./ui";
import { api } from "@/lib/api";

export type T = { id: number; project: number; project_title: string; title: string; description: string; assignee: number | null; assignee_detail: Person | null; status: string; priority: string; due_date: string | null; visible_to_client: boolean };

export default function TaskForm({ initial, onClose, onSaved }: { initial: Partial<T> & { project: number }; onClose: () => void; onSaved: () => void }) {
  const [people] = useLoad<Person[]>("staff/people");
  const [f, setF] = useState({
    project: initial.project, title: initial.title || "", description: initial.description || "", assignee: initial.assignee ? String(initial.assignee) : "",
    status: initial.status || "todo", priority: initial.priority || "normal", due_date: initial.due_date || "", visible_to_client: initial.visible_to_client ?? true,
  });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...f, assignee: f.assignee ? Number(f.assignee) : null, due_date: f.due_date || null };
    try { await api(initial.id ? `staff/tasks/${initial.id}` : "staff/tasks", { method: initial.id ? "PATCH" : "POST", body }); onSaved(); }
    catch (e) { setErr((e as Error).message); }
  }
  async function del() {
    if (!initial.id || !confirm("Delete this task?")) return;
    await api(`staff/tasks/${initial.id}`, { method: "DELETE" }).catch((e) => setErr(e.message));
    onSaved();
  }
  return (
    <Modal title={initial.id ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={save} className="stack">
        {err && <p className="alert alert-err">{err}</p>}
        <label className="field">Task *<input required value={f.title} onChange={set("title")} /></label>
        <label className="field">Details<textarea rows={3} value={f.description} onChange={set("description")} /></label>
        <div className="form-grid">
          <label className="field">Assigned to<select value={f.assignee} onChange={set("assignee")}><option value="">Nobody yet</option>{people?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="field">Status<select value={f.status} onChange={set("status")}><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option></select></label>
          <label className="field">Priority<select value={f.priority} onChange={set("priority")}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
          <label className="field">Due<input type="date" value={f.due_date || ""} onChange={set("due_date")} /></label>
        </div>
        <label className="check"><input type="checkbox" checked={f.visible_to_client} onChange={(e) => setF({ ...f, visible_to_client: e.target.checked })} /> Client can see this task</label>
        <div className="row"><button className="btn">Save</button><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>{initial.id && <button type="button" className="btn btn-danger" onClick={del}>Delete</button>}</div>
      </form>
    </Modal>
  );
}
