"use client";
import { useState } from "react";
import { Modal, useForm } from "@/components/panel/ui";
import { api } from "@/lib/api";

export type C = { id: number; name: string; company: string; email: string; phone: string; country: string; address: string; notes: string; notify_email: boolean; notify_sms: boolean; has_portal: boolean; doc_count: number };
export const blankClient = { id: 0, name: "", company: "", email: "", phone: "", country: "PK", address: "", notes: "", notify_email: true, notify_sms: true };
type blank = typeof blankClient;

export default function ClientForm({ initial, onClose, onSaved }: { initial: blank; onClose: () => void; onSaved: (c: C) => void }) {
  const { f, bind, check } = useForm(initial);
  const [err, setErr] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const c = await api<C>(f.id ? `staff/clients/${f.id}` : "staff/clients", { method: f.id ? "PATCH" : "POST", body: f });
      onSaved(c);
    } catch (e) { setErr((e as Error).message); }
  }
  return (
    <Modal title={f.id ? "Edit client" : "Add client"} onClose={onClose}>
      <form onSubmit={save} className="stack">
        {err && <p className="alert alert-err">{err}</p>}
        <div className="form-grid">
          <label className="field">Name *<input required {...bind("name")} /></label>
          <label className="field">Company<input {...bind("company")} /></label>
          <label className="field">Email<input type="email" {...bind("email")} /></label>
          <label className="field">Phone / WhatsApp<input {...bind("phone")} placeholder="0300 1234567 or +44…" /></label>
          <label className="field">Country<select {...bind("country")}><option value="PK">Pakistan</option><option value="GB">United Kingdom</option><option value="AE">UAE</option><option value="SA">Saudi Arabia</option><option value="US">USA</option></select></label>
        </div>
        <label className="field">Address<textarea rows={2} {...bind("address")} /></label>
        <label className="field">Private notes<textarea rows={2} {...bind("notes")} /></label>
        <div className="row"><label className="check"><input type="checkbox" {...check("notify_email")} /> Send emails</label><label className="check"><input type="checkbox" {...check("notify_sms")} /> Send SMS</label></div>
        <div className="row"><button className="btn">Save</button><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
