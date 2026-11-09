"use client";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Load JSON from the API; returns [data, reload, error]. */
export function useLoad<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    if (!path) return;
    setError("");
    api<T>(path).then(setData).catch((e) => setError((e as Error).message));
  }, [path]); // eslint-disable-line
  useEffect(() => { load(); }, [load, ...deps]); // eslint-disable-line
  return [data, load, error, setData] as const;
}

export function Status({ s, label }: { s: string; label?: string }) {
  const labels: Record<string, string> = { doing: "in progress", todo: "to do", active: "in progress", hold: "on hold", review: "in review", done: "done", pending: "waiting" };
  return <span className={`pill st-${s}`}>{label || labels[s] || s}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { width: "min(860px, 100%)" } : undefined}>
        <div className="row between" style={{ marginBottom: 12 }}><h3 style={{ margin: 0 }}>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="table-wrap empty">{children}</div>;
}

export function Flash({ msg, onDone }: { msg: { ok: boolean; text: string } | null; onDone: () => void }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); } }, [msg, onDone]);
  if (!msg) return null;
  return <p className={`alert ${msg.ok ? "alert-ok" : "alert-err"}`} style={{ marginBottom: 16 }} role="status">{msg.text}</p>;
}

/** Small form helper: const [f, set, setF] = useForm({...}); <input {...set("name")} /> */
export function useForm<T extends Record<string, any>>(initial: T) {
  const [f, setF] = useState<T>(initial);
  const bind = (k: keyof T) => ({
    value: String(f[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((old) => ({ ...old, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value })),
  });
  const check = (k: keyof T) => ({
    checked: !!f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF((old) => ({ ...old, [k]: e.target.checked })),
  });
  return { f, setF, bind, check };
}

export function Progress({ value }: { value: number }) {
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${value}%` }} /></div>;
}
