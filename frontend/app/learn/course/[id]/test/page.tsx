"use client";
import { Award, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTitle } from "@/components/panel/AppShell";
import { api } from "@/lib/api";

type Paper = { attempt: number; questions: { id: number; text: string; options: string[] }[]; answers: Record<string, number>; ends_at: string | null };
type Result = { score: number; correct_count: number; total: number; passed: boolean; pass_mark: number; certificate: string | null; test: { can_start: boolean; reason: string; attempts_used: number; attempts_allowed: number } };

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  useTitle("Final test");
  const [paper, setPaper] = useState<Paper | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const submitted = useRef(false);

  const submit = useCallback(async (a: Record<string, number>) => {
    if (!paper || submitted.current) return;
    submitted.current = true; setBusy(true);
    try { setResult(await api<Result>(`learn/attempts/${paper.attempt}`, { body: { answers: a } })); }
    catch (e) { setErr((e as Error).message); submitted.current = false; } finally { setBusy(false); }
  }, [paper]);

  async function start() {
    setErr(""); setBusy(true);
    try { const p = await api<Paper>(`learn/courses/${id}/test`, { body: {} }); setPaper(p); setAnswers(p.answers || {}); setStarted(true); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  // countdown + auto-submit when time runs out
  useEffect(() => {
    if (!paper?.ends_at || result) return;
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(paper.ends_at!).getTime() - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) submit(answers);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [paper, result, answers, submit]);

  function pick(qid: number, i: number) {
    const a = { ...answers, [String(qid)]: i };
    setAnswers(a);
    api(`learn/attempts/${paper!.attempt}`, { method: "PUT", body: { answers: a } }).catch(() => {});   // autosave
  }

  if (result) {
    return (
      <div className="panel stack" style={{ maxWidth: 640, textAlign: "center", alignItems: "center" }}>
        {result.passed ? <Award size={56} className="accent" /> : null}
        <h2 className="h2" style={{ margin: 0 }}>{result.passed ? "Congratulations, you passed!" : "Not passed this time"}</h2>
        <p className="lead" style={{ margin: 0 }}>Your score: <b>{result.score}%</b> ({result.correct_count} of {result.total} right). Pass mark {result.pass_mark}%.</p>
        {result.passed && result.certificate && <Link className="btn" href={`/learn/certificates/${result.certificate}`}>View &amp; download certificate</Link>}
        {!result.passed && (result.test.can_start
          ? <p className="small">You have {result.test.attempts_allowed - result.test.attempts_used} tries left. Review the lessons, then try again.</p>
          : <p className="small">{result.test.reason}</p>)}
        <div className="row">
          <Link className="btn btn-ghost" href={`/learn/course/${id}`}>Back to the course</Link>
          {!result.passed && result.test.can_start && <button className="btn" onClick={() => { setResult(null); setPaper(null); setStarted(false); submitted.current = false; }}>Try again</button>}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="panel stack" style={{ maxWidth: 640 }}>
        <h2 className="h3" style={{ margin: 0 }}>Before you start</h2>
        <ul className="small" style={{ margin: 0 }}>
          <li>Choose one answer for each question. Your answers are saved as you go.</li>
          <li>If there is a time limit, the test is sent automatically when the time ends.</li>
          <li>Submitting uses one of your tries.</li>
        </ul>
        {err && <p className="alert alert-err" style={{ margin: 0 }}>{err}</p>}
        <div className="row"><button className="btn" disabled={busy} onClick={start}>{busy ? "Loading…" : "Start / continue the test"}</button><Link className="btn btn-ghost" href={`/learn/course/${id}`}>Back</Link></div>
      </div>
    );
  }

  const answered = paper ? paper.questions.filter((q) => answers[String(q.id)] !== undefined).length : 0;
  return (
    <div className="stack" style={{ maxWidth: 820, ["--gap" as string]: "16px" }}>
      <div className="panel row between timer">
        <span className="small"><b>{answered}</b> of {paper!.questions.length} answered</span>
        {left !== null && <span className={left < 60 ? "minus" : ""}><Clock size={15} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}
      </div>
      {paper!.questions.map((q, n) => (
        <section key={q.id} className="panel q-card">
          <b>{n + 1}. {q.text}</b>
          {q.options.map((o, i) => (
            <label key={i} className={`q-opt ${answers[String(q.id)] === i ? "on" : ""}`}>
              <input type="radio" name={`q${q.id}`} checked={answers[String(q.id)] === i} onChange={() => pick(q.id, i)} /><span>{o}</span>
            </label>
          ))}
        </section>
      ))}
      {err && <p className="alert alert-err">{err}</p>}
      <div className="row">
        <button className="btn" disabled={busy} onClick={() => {
          if (answered < paper!.questions.length && !confirm(`${paper!.questions.length - answered} questions are not answered. Submit anyway?`)) return;
          submit(answers);
        }}>{busy ? "Marking…" : "Submit test"}</button>
      </div>
    </div>
  );
}
