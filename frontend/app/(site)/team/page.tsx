import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { CeoQuote, PageHero, Photo } from "@/components/bits";
import { company, departments, team } from "@/lib/content";

export const metadata: Metadata = { title: "Team", description: `The people behind ${company.name}.` };

export default function Team() {
  return (
    <>
      <PageHero eyebrow="Team" title={<>The people behind <span className="accent">{company.name}</span></>} lead="Engineers, designers and support specialists who care about your business." />
      <section className="section">
        <div className="wrap grid" style={{ ["--min" as string]: "280px" }}>
          {team.map((m) => (
            <div key={m.name} className="card reveal" style={{ overflow: "hidden" }}>
              {m.photo ? <div className="photo" style={{ height: 300, borderRadius: 0 }}><img src={`/img/team/${m.photo}`} alt={m.name} /></div>
                : <div style={{ height: 220, display: "grid", placeItems: "center", background: "var(--surface-2)" }}><span className="avatar" style={{ width: 96, height: 96, fontSize: 30 }}>{m.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span></div>}
              <div className="stack" style={{ padding: 24, ["--gap" as string]: "8px" }}>
                <h3 style={{ fontSize: 20 }}>{m.name}</h3><span className="accent small" style={{ fontWeight: 700 }}>{m.role}</span><p className="muted small">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section section-alt">
        <div className="wrap hero-grid" style={{ gap: 56 }}>
          <div className="stack reveal">
            <span className="eyebrow">Departments</span><h2 className="h2">How our team is organised</h2>
            <div className="grid" style={{ ["--min" as string]: "220px", marginTop: 16 }}>
              {departments.map((d) => <div key={d.title} className="stack" style={{ ["--gap" as string]: "8px" }}><span className="icon-box"><Icon name={d.icon} /></span><b>{d.title}</b><p className="muted small">{d.text}</p></div>)}
            </div>
          </div>
          <Photo k="process" alt="Team planning on a glass wall with sticky notes" h={440} className="reveal" />
        </div>
      </section>
      <CeoQuote />
      <section className="section center">
        <div className="wrap stack" style={{ alignItems: "center" }}>
          <h2 className="h2">Want to join us?</h2>
          <p className="muted">We run internship programs and hire throughout the year. Send your CV to {company.email}.</p>
          <Link href="/contact" className="btn">Get in touch</Link>
        </div>
      </section>
    </>
  );
}
