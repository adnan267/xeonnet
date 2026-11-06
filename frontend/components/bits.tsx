import Link from "next/link";
import { Check, Star } from "lucide-react";
import { ceoQuote, company, photo } from "@/lib/content";

export function Photo({ k, alt, h, w = 1200, className = "", style }: { k: string; alt: string; h?: number | string; w?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`photo ${className}`} style={{ height: h, ...style }}>
      <img src={photo(k, w)} srcSet={`${photo(k, Math.round(w / 2))} ${Math.round(w / 2)}w, ${photo(k, w)} ${w}w`} sizes="(max-width: 760px) 100vw, 50vw" alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead?: string; children?: React.ReactNode }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="stack">
          <span className="eyebrow"><span className="dot" />{eyebrow}</span>
          <h1 className="h1">{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function Checks({ items }: { items: string[] }) {
  return <ul className="check-list">{items.map((t) => <li key={t}><Check />{t}</li>)}</ul>;
}

export function Stars({ n }: { n: number }) {
  return <span className="stars" aria-label={`${n} out of 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} fill={i <= n ? "currentColor" : "none"} />)}</span>;
}

export function CeoQuote() {
  return (
    <section className="section section-alt">
      <div className="wrap quote reveal">
        <span className="mark" aria-hidden="true">“</span>
        <p>{ceoQuote}</p>
        <div className="row" style={{ ["--gap" as string]: "14px" }}>
          <span className="avatar">MA</span>
          <div style={{ textAlign: "left" }}><b>{company.ceo}</b><p className="muted small">CEO, {company.name}</p></div>
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ title = "Let’s build your next project.", text }: { title?: string; text?: string }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-band reveal">
          <div className="stack" style={{ ["--gap" as string]: "10px", maxWidth: 620 }}>
            <h2>{title}</h2>
            <p style={{ fontSize: 17, fontWeight: 500 }}>{text || `Free consultation and a written quote. Call or WhatsApp ${company.phone}.`}</p>
          </div>
          <div className="row">
            <Link href="/contact" className="btn btn-dark">Start a Project</Link>
            <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener" className="btn btn-line">WhatsApp us</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatsAppFloat() {
  return (
    <a className="wa-float no-print" href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Hello Xeon Net, I'd like to discuss a project.")}`} target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c.7.3 1.3.5 1.7.6a4.2 4.2 0 0 0 1.9.1 3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.2-.6-.4zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6zM12 0a12 12 0 0 0-10.3 18.1L0 24l6-1.6A12 12 0 1 0 12 0z" /></svg>
    </a>
  );
}
