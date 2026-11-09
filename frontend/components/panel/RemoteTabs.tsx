"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "./AppShell";

export default function RemoteTabs({ counts }: { counts?: { to_review?: number; withdrawals?: number } }) {
  const path = usePathname();
  const { can } = useMe();
  const tabs = [
    { href: "/staff/remote", label: "Review work", n: counts?.to_review, show: can("remote") },
    { href: "/staff/remote/tasks", label: "Tasks", show: can("remote") },
    { href: "/staff/remote/workers", label: "Workers", show: can("remote") },
    { href: "/staff/remote/withdrawals", label: "Withdrawals", n: counts?.withdrawals, show: can("payouts") },
    { href: "/staff/remote/positions", label: "Positions & settings", show: can("remote") },
  ];
  return (
    <nav className="subtabs">
      {tabs.filter((t) => t.show).map((t) => (
        <Link key={t.href} href={t.href} className={path === t.href ? "on" : ""}>{t.label}{t.n ? <span className="pill st-pending">{t.n}</span> : null}</Link>
      ))}
    </nav>
  );
}
