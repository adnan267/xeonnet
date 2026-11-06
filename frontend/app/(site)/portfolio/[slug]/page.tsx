import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Checks, CtaBand, PageHero, Photo } from "@/components/bits";
import { catPhoto, portfolio } from "@/lib/content";

export function generateStaticParams() {
  return portfolio.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = portfolio.find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = portfolio.find((x) => x.slug === slug) as (typeof portfolio)[number] & { features?: string[] } | undefined;
  if (!p) notFound();
  const facts = [["Category", p.category], ["Client", p.client], ["Year", String(p.year || "")]].filter(([, v]) => v);
  return (
    <>
      <PageHero eyebrow={p.category} title={p.title} lead={p.summary}>
        <div className="row">
          {facts.map(([k, v]) => <span key={k} className="tag">{k}: {v}</span>)}
          {p.sample && <span className="pill">Sample project</span>}
          {p.url && <a className="btn btn-sm" href={p.url} target="_blank" rel="noopener">Visit website</a>}
        </div>
      </PageHero>
      <section className="section">
        <div className="wrap stack" style={{ ["--gap" as string]: "48px" }}>
          {p.images?.length ? (
            <div className="grid" style={{ ["--min" as string]: "320px" }}>{p.images.map((src) => <div key={src} className="photo reveal"><img src={src} alt={`${p.title} screenshot`} /></div>)}</div>
          ) : <Photo k={catPhoto(p.category)} alt="" h={440} w={1600} className="reveal" />}
          <div className="grid" style={{ ["--min" as string]: "320px", ["--gap" as string]: "40px" }}>
            <div className="stack reveal"><span className="eyebrow">The challenge</span><p className="muted" style={{ fontSize: 17 }}>{p.challenge}</p></div>
            <div className="stack reveal"><span className="eyebrow">Our solution</span><p className="muted" style={{ fontSize: 17 }}>{p.solution}</p></div>
          </div>
          <div className="grid" style={{ ["--min" as string]: "300px", ["--gap" as string]: "40px" }}>
            {p.features?.length ? <div className="stack reveal"><h3 className="h3">Key features</h3><Checks items={p.features} /></div> : null}
            {p.results?.length ? <div className="stack reveal"><h3 className="h3">Results</h3><Checks items={p.results} /></div> : null}
          </div>
          {p.tech?.length ? <div className="tags reveal">{p.tech.map((t) => <span key={t} className="tag">{t}</span>)}</div> : null}
          <div><Link href="/portfolio" className="btn btn-ghost">← All projects</Link></div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
