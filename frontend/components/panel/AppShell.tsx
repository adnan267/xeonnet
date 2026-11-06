"use client";
import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Brand } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { api, ApiError } from "@/lib/api";

export type Me = {
  id: number; email: string; name: string; first_name: string; last_name: string; role: string; phone: string; job_title: string;
  is_client: boolean; client?: { id: number; name: string; company: string } | null;
  modules?: Record<string, { read: boolean; write: boolean }>;
};
export type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }>; module?: string };

const MeCtx = createContext<{ me: Me; can: (m: string, write?: boolean) => boolean }>(null as never);
export const useMe = () => useContext(MeCtx);

const TitleCtx = createContext<(t: string) => void>(() => {});
/** Call in a page to set the top bar title. */
export function useTitle(t: string) {
  const set = useContext(TitleCtx);
  useEffect(() => { set(t); document.title = `${t} | Xeon Net`; }, [t, set]);
}

const ROLE_LABEL: Record<string, string> = { admin: "Admin", sales: "Sales", accounts: "Accounts", hr: "HR", staff: "Team member", client: "Client" };

export default function AppShell({ area, nav, children }: { area: "staff" | "portal"; nav: NavItem[]; children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<Me>("auth/me").then((m) => {
      if (area === "staff" && m.is_client) return router.replace("/portal");
      if (area === "portal" && !m.is_client) return router.replace("/staff");
      setMe(m);
    }).catch((e) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) router.replace(`/login?next=${encodeURIComponent(path)}`);
    });
  }, []); // eslint-disable-line
  useEffect(() => setOpen(false), [path]);

  if (!me) return <div className="auth-wrap"><p className="muted">Loading…</p></div>;
  const can = (m: string, write = false) => !!me.modules?.[m]?.[write ? "write" : "read"];
  const items = nav.filter((n) => !n.module || area === "portal" || can(n.module));
  const on = (href: string) => (href === `/${area}` ? path === href : path.startsWith(href));

  async function logout() {
    await api("auth/logout", { body: {} }).catch(() => {});
    router.replace("/login");
  }

  return (
    <MeCtx.Provider value={{ me, can }}>
      <TitleCtx.Provider value={setTitle}>
        <div className="app">
          {open && <div className="scrim" onClick={() => setOpen(false)} />}
          <aside className={`side ${open ? "open" : ""}`}>
            <Brand href={`/${area}`} />
            {items.map((n) => <Link key={n.href} href={n.href} className={`nav-item ${on(n.href) ? "on" : ""}`}><n.icon size={18} />{n.label}</Link>)}
            <div className="grow" />
            <div className="who">
              <b>{me.name}</b>
              <span className="muted small">{me.is_client ? me.client?.company || me.client?.name : `${ROLE_LABEL[me.role] || me.role}${me.job_title ? " · " + me.job_title : ""}`}</span>
              <div className="row" style={{ ["--gap" as string]: "8px" }}>
                <Link href={`/${area}/profile`} className="btn btn-ghost btn-xs">Profile</Link>
                <button className="btn btn-ghost btn-xs" onClick={logout}><LogOut size={14} /> Logout</button>
              </div>
            </div>
          </aside>
          <div className="main">
            <div className="topbar no-print">
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <button className="icon-btn app-menu" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
                <h1>{title}</h1>
              </div>
              <div className="row">
                <Link href="/" className="btn btn-ghost btn-sm hide-sm" target="_blank">View website</Link>
                <ThemeToggle />
              </div>
            </div>
            <div className="content">{children}</div>
          </div>
        </div>
      </TitleCtx.Provider>
    </MeCtx.Provider>
  );
}
