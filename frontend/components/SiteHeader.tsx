"use client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/content";
import { Brand } from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="site-header">
      <div className="wrap bar">
        <Brand />
        <nav className="nav" aria-label="Main">
          {nav.map(([href, text]) => (
            <Link key={href} href={href} className={on(href) ? "on" : ""}>{text}</Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost btn-sm hide-sm">Login</Link>
          <Link href="/contact" className="btn btn-sm quote-btn">Get a Quote</Link>
          <button className="icon-btn menu-btn" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <nav className={`mobile-nav ${open ? "open" : ""}`} aria-label="Mobile">
        {nav.map(([href, text]) => <Link key={href} href={href} className={on(href) ? "accent" : ""}>{text}</Link>)}
        <Link href="/verify">Verify a Certificate</Link>
        <Link href="/login">Client / Staff Login</Link>
        <Link href="/contact" className="btn" style={{ marginTop: 12, borderBottom: 0 }}>Get a Quote</Link>
      </nav>
    </header>
  );
}
