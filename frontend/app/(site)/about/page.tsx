import type { Metadata } from "next";
import Icon from "@/components/Icon";
import { CeoQuote, CtaBand, PageHero, Photo } from "@/components/bits";
import { company, journey, processDetail, values, years } from "@/lib/content";

export const metadata: Metadata = { title: "About", description: `The story of ${company.name}, in IT since ${company.founded}.` };

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title={<>{years} years of growing <span className="accent">with technology</span></>}
        lead={`${company.name} started in ${company.founded} with computer hardware and networking. Today we build websites, apps, cloud systems and AI for businesses in Pakistan and abroad.`} />
      <section className="section">
        <div className="wrap hero-grid" style={{ gap: 64 }}>
          <div className="stack reveal" style={{ ["--gap" as string]: "18px" }}>
            <span className="eyebrow">Our story</span>
            <h2 className="h2">From the first network cable to AI</h2>
            <p className="muted">We began by fixing computers, installing networks and keeping offices online. As our clients grew, so did we: into web design, hosting, e-commerce, custom software, mobile apps, cloud and artificial intelligence.</p>
            <p className="muted">What has not changed is how we work: honest advice, written quotes, and support long after launch. Our CEO, {company.ceo}, has led the company since day one.</p>
          </div>
          <Photo k="team" alt="Xeon Net team collaborating around a computer" h={420} className="reveal" />
        </div>
      </section>
      <section className="section section-alt">
        <div className="wrap">
          <div className="sec-head reveal"><span className="eyebrow">Our journey</span><h2>Milestones since {company.founded}</h2></div>
          <div className="timeline">
            {journey.map((j) => (
              <div key={j.year} className="t reveal">
                <span className="year">{j.year}</span>
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <h3 style={{ fontSize: 20 }}>{j.title}</h3><p className="muted">{j.text}</p>
                  <div className="tags">{j.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="sec-head center reveal"><span className="eyebrow">What we stand for</span><h2>Our values</h2></div>
          <div className="grid" style={{ ["--min" as string]: "240px" }}>
            {values.map((v) => (
              <div key={v.title} className="card card-pad stack reveal" style={{ ["--gap" as string]: "12px" }}>
                <span className="icon-box"><Icon name={v.icon} /></span><h3 style={{ fontSize: 18 }}>{v.title}</h3><p className="muted small">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="wrap">
          <div className="sec-head reveal"><span className="eyebrow">How we work</span><h2>Our process, step by step</h2></div>
          <ol className="process">{processDetail.map(([t, x], i) => <li key={t} className="reveal"><span className="n">{String(i + 1).padStart(2, "0")}</span><h3 style={{ fontSize: 19 }}>{t}</h3><p className="muted small">{x}</p></li>)}</ol>
        </div>
      </section>
      <CeoQuote />
      <CtaBand />
    </>
  );
}
