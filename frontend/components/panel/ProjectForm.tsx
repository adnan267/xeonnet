"use client";
import { useState } from "react";
import type { C } from "./ClientForm";
import { Modal, useLoad } from "./ui";
import { api } from "@/lib/api";

export type Person = { id: number; name: string; email: string; role: string; job_title: string };
export type P = {
  id: number; client: number; client_name: string; title: string; description: string; status: string; start_date: string | null; due_date: string | null;
  manager: number | null; manager_detail: Person | null; members: number[]; members_detail: Person[]; visible_to_client: boolean; progress: number;
  task_counts: { todo: number; doing: number; done: number };
};

export default function ProjectForm({ initial, onClose, onSaved }: { initial: Partial<P>; onClose: () => void; onSaved: (p: P) => void }) {
  const [clients] = useLoad<C[]>("staff/clients");
  const [people] = useLoad<Person[]>("staff/people");
  const [f, setF] = useState({
    client: initial.client ? String(initial.client) : "", title: initial.title || "", description: initial.description || "",
    status: initial.status || "planning", start_date: initial.start_date || "", due_date: initial.due_date || "",
    manager: initial.manager ? String(initial.manager) : "", members: initial.members || [], visible_to_client: initial.visible_to_client ?? true,
  });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...f, client: Number(f.client), manager: f.manager ? Number(f.manager) : null, start_date: f.start_date || null, due_date: f.due_date || null };
    try { onSaved(await api<P>(initial.id ? `staff/projects/${initial.id}` : "staff/projects", { method: initial.id ? "PATCH" : "POST", body })); }
    catch (e) { setErr((e as Error).message); }
  }
  const toggle = (id: number) => setF({ ...f, members: f.members.includes(id) ? f.members.filter((x) => x !== id) : [...f.members, id] });
  return (
    <Modal title={initial.id ? "Edit project" : "New project"} onClose={onClose} wide>
      <form onSubmit={save} className="stack">
        {err && <p className="alert alert-err">{err}</p>}
        <div className="form-grid">
          <label className="field">Client *<select required value={f.client} onChange={set("client")}><option value="">Choose…</option>{clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field">Project title *<input required value={f.title} onChange={set("title")} /></label>
          <label className="field">Status<select value={f.status} onChange={set("status")}><option value="planning">Planning</option><option value="active">In progress</option><option value="review">In review</option><option value="hold">On hold</option><option value="done">Completed</option></select></label>
          <label className="field">Project lead<select value={f.manager} onChange={set("manager")}><option value="">—</option>{people?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="field">Start<input type="date" value={f.start_date || ""} onChange={set("start_date")} /></label>
          <label className="field">Deadline<input type="date" value={f.due_date || ""} onChange={set("due_date")} /></label>
        </div>
        <label className="field">Description<textarea rows={3} value={f.description} onChange={set("description")} /></label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ marginBottom: 8 }}>Team members</legend>
          <div className="row">{people?.map((p) => <label key={p.id} className="check"><input type="checkbox" checked={f.members.includes(p.id)} onChange={() => toggle(p.id)} />{p.name}</label>)}</div>
        </fieldset>
        <label className="check"><input type="checkbox" checked={f.visible_to_client} onChange={(e) => setF({ ...f, visible_to_client: e.target.checked })} /> Client can see this project in their portal</label>
        <div className="row"><button className="btn">Save</button><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
