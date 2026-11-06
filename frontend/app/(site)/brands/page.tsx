import type { Metadata } from "next";
import Icon from "@/components/Icon";
import { Checks, CtaBand, PageHero, Photo } from "@/components/bits";
import { brands, company } from "@/lib/content";

export const metadata: Metadata = { title: "Our Brands", description: `Businesses built and run by ${company.name}.` };

export default function Brands() {
  return (
    <>
      <PageHero eyebrow="Our own businesses" title={<>We build <span className="accent">brands</span> too</>}
        lead={`Beyond client work, ${company.name} runs its own businesses — proof that we use the same technology we sell.`} />
      {brands.map((b, i) => (
        <section key={b.slug} id={b.slug} className={`section ${i % 2 ? "section-alt" : ""}`}>
          <div className="wrap hero-grid" style={{ gap: 64 }}>
            <div className="stack reveal" style={{ ["--gap" as string]: "18px", order: i % 2 ? 2 : 0 }}>
              <span className="row" style={{ ["--gap" as string]: "12px" }}><span className="icon-box"><Icon name={b.icon} /></span><span className="eyebrow">{b.industry}</span><span className="pill">{b.status}</span></span>
              <h2 className="h2">{b.name}</h2>
              <p className="accent" style={{ fontWeight: 700 }}>{b.tagline}</p>
              <p className="muted">{b.text}</p>
              <Checks items={b.features} />
              {b.url && <div><a href={b.url} target="_blank" rel="noopener" className="btn">Visit {b.name}</a></div>}
            </div>
            <Photo k={b.slug} alt="" h={400} className="reveal" />
          </div>
        </section>
      ))}
      <CtaBand title="Want a platform like these?" text="We can build an e-commerce, consultancy or real estate system for your business too." />
    </>
  );
}
