"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "./AppShell";

export default function LearnTabs({ toCheck }: { toCheck?: number }) {
  const path = usePathname();
  const { can } = useMe();
  const tabs = [
    { href: "/staff/learning", label: "Courses", show: can("learning") },
    { href: "/staff/learning/students", label: "Students", show: can("learning") },
    { href: "/staff/learning/payments", label: "Fee payments", n: toCheck, show: can("fees") },
  ];
  return (
    <nav className="subtabs">
      {tabs.filter((t) => t.show).map((t) => <Link key={t.href} href={t.href} className={path === t.href ? "on" : ""}>{t.label}{t.n ? <span className="pill st-pending">{t.n}</span> : null}</Link>)}
    </nav>
  );
}
