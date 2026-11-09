"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import LearnTabs from "@/components/panel/LearnTabs";
import { Flash, Modal, Status, useLoad } from "@/components/panel/ui";
import { rs } from "@/components/learn/shared";
import { api } from "@/lib/api";

type Course = { id: number; title: string; slug: string; category: string; price: string; is_published: boolean; lessons_count: number; questions_count: number; students: number };
type Overview = { courses: number; students: number; studying: number; completed: number; payments_to_check: number; fees_received: string };
type Cfg = { enroll_open: boolean; payment_instructions: string; gateway_enabled: boolean };

export default function LearningAdmin() {
  useTitle("Courses");
  const { can } = useMe();
  const router = useRouter();
  const [rows] = useLoad<Course[]>("staff/learn/courses");
  const [o] = useLoad<Overview>("staff/learn/overview");
  const [cfgData] = useLoad<Cfg>("staff/learn/settings");
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (cfgData) setCfg(cfgData); }, [cfgData]);
  const write = can("learning", true);

  const [newTitle, setNewTitle] = useState<string | null>(null);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    try { const c = await api<Course>("staff/learn/courses", { body: { title: newTitle } }); router.push(`/staff/learning/${c.id}`); }
    catch (x) { setMsg({ ok: false, text: (x as Error).message }); }
  }
  async function saveCfg(e: React.FormEvent) {
    e.preventDefault();
    try { setCfg(await api<Cfg>("staff/learn/settings", { method: "PUT", body: cfg })); setMsg({ ok: true, text: "Saved." }); }
    catch (x) { setMsg({ ok: false, text: (x as Error).message }); }
  }

  return (
    <>
      <LearnTabs toCheck={o?.payments_to_check} />
      <Flash msg={msg} onDone={() => setMsg(null)} />
      {o && (
        <div className="kpis" style={{ marginBottom: 20 }}>
          <div className="kpi"><b>{o.courses}</b><span>Published courses</span></div>
          <div className="kpi"><b>{o.students}</b><span>Students</span></div>
          <div className="kpi"><b>{o.studying}</b><span>Studying now</span></div>
          <div className="kpi"><b>{o.completed}</b><span>Passed / certified</span></div>
          <Link href="/staff/learning/payments" className="kpi"><b style={{ color: o.payments_to_check ? "var(--accent)" : undefined }}>{o.payments_to_check}</b><span>Fee payments to check</span></Link>
          <div className="kpi"><b>{rs(o.fees_received)}</b><span>Fees received</span></div>
        </div>
      )}
      <div className="toolbar"><h3 className="panel-title" style={{ margin: 0 }}>Courses</h3>
        <div className="row"><a className="btn btn-ghost btn-sm" href="/courses" target="_blank">Public page</a>{write && <button className="btn btn-sm" onClick={() => setNewTitle("")}><Plus /> New course</button>}</div></div>
      <div className="table-wrap"><table className="tbl">
        <thead><tr><th>Course</th><th>Fee</th><th>Content</th><th>Students</th><th>Status</th></tr></thead>
        <tbody>{rows?.map((c) => (
          <tr key={c.id}>
            <td><Link href={`/staff/learning/${c.id}`}><b>{c.title}</b></Link><br /><span className="muted small">{c.category}</span></td>
            <td>{rs(c.price)}</td>
            <td className="small">{c.lessons_count} lessons · {c.questions_count} questions</td>
            <td>{c.students}</td>
            <td>{c.is_published ? <Status s="active" label="published" /> : <Status s="draft" label="draft" />}</td>
          </tr>
        ))}</tbody>
      </table></div>
      {newTitle !== null && (
        <Modal title="New course" onClose={() => setNewTitle(null)}>
          <form onSubmit={create} className="stack">
            <label className="field">Course title<input required autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Graphic Design with Canva" /></label>
            <div className="row"><button className="btn">Create &amp; add lessons</button><button type="button" className="btn btn-ghost" onClick={() => setNewTitle(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
      {cfg && (
        <form onSubmit={saveCfg} className="panel stack" style={{ marginTop: 20 }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Enrolment &amp; payment settings</h3>
          <label className="field">How students should pay <small>(shown on the payment step)</small>
            <textarea rows={4} disabled={!write} value={cfg.payment_instructions} onChange={(e) => setCfg({ ...cfg, payment_instructions: e.target.value })}
              placeholder={"JazzCash: 03xx xxxxxxx (Account name)\nEasypaisa: 03xx xxxxxxx\nMention your email in the payment note."} /></label>
          <p className="muted small" style={{ margin: 0 }}>Bank details from Settings → Bank details are shown too.</p>
          <label className="row" style={{ ["--gap" as string]: "8px" }}><input type="checkbox" disabled={!write} checked={cfg.enroll_open} onChange={(e) => setCfg({ ...cfg, enroll_open: e.target.checked })} /> Students can enroll</label>
          <p className="muted small" style={{ margin: 0 }}>Online card / wallet payments need a merchant account (JazzCash, Easypaisa or a card gateway). Until then students pay manually and you approve under Fee payments.</p>
          {write && <div><button className="btn btn-sm">Save</button></div>}
        </form>
      )}
    </>
  );
}
