import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { CtaBand, PageHero, Photo } from "@/components/bits";
import { allServices, tiers } from "@/lib/content";

export const metadata: Metadata = { title: "Services", description: "IT services from basic support to advanced development, cloud, security and AI." };

export default function Services() {
  return (
    <>
      <PageHero eyebrow="Services" title={<>{allServices.length} services, <span className="accent">three levels</span></>}
        lead="Whether you run a small office or a large company, pick the level you need today and grow from there." />
      {tiers.map((t, ti) => (
        <section key={t.key} id={t.key} className={`section ${ti % 2 ? "section-alt" : ""}`}>
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">Level {t.level}</span>
              <h2>{t.name}</h2>
              <p>{t.intro}</p>
            </div>
            <div className="grid" style={{ ["--min" as string]: "320px" }}>
              {t.services.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`} className="card svc-photo-card reveal">
                  <Photo k={s.slug} alt="" w={700} />
                  <div className="body">
                    <span className="row" style={{ ["--gap" as string]: "12px", flexWrap: "nowrap" }}><span className="icon-box"><Icon name={s.icon} /></span><h3 style={{ fontSize: 19 }}>{s.title}</h3></span>
                    <p className="muted small">{s.short}</p>
                    <ul className="muted small" style={{ margin: 0, paddingLeft: 18 }}>{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
                    <span style={{ marginTop: "auto", fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>Details →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
      <CtaBand title="Not sure which service you need?" text="Tell us about your business and we will suggest the right mix, with a written quote." />
    </>
  );
}
