import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/Icon";
import { Checks, CtaBand, PageHero, Photo } from "@/components/bits";
import { allServices, serviceDetails } from "@/lib/content";

export function generateStaticParams() {
  return allServices.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = allServices.find((x) => x.slug === slug);
  return s ? { title: s.title, description: s.short } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = allServices.find((x) => x.slug === slug);
  if (!s) notFound();
  const d = serviceDetails[slug];
  const related = allServices.filter((x) => x.tier.key === s.tier.key && x.slug !== slug).slice(0, 3);
  return (
    <>
      <PageHero eyebrow={`${s.tier.name} · Level ${s.tier.level}`} title={s.title} lead={s.short}>
        <div className="row"><Link href="/contact" className="btn">Get a quote <ArrowRight /></Link><Link href="/services" className="btn btn-ghost">All services</Link></div>
      </PageHero>
      <section className="section">
        <div className="wrap hero-grid" style={{ gap: 64, alignItems: "start" }}>
          <div className="stack reveal" style={{ ["--gap" as string]: "20px" }}>
            <h2 className="h2" style={{ fontSize: 32 }}>Overview</h2>
            <p className="muted" style={{ fontSize: 17 }}>{d?.overview || s.short}</p>
            <h3 className="h3" style={{ marginTop: 12 }}>What&apos;s included</h3>
            <Checks items={s.points} />
          </div>
          <Photo k={slug} alt={s.title} h={420} className="reveal" />
        </div>
      </section>
      {d && (
        <section className="section section-alt">
          <div className="wrap">
            <div className="sec-head reveal"><span className="eyebrow">Benefits</span><h2>Why it matters</h2></div>
            <div className="grid" style={{ ["--min" as string]: "260px" }}>
              {d.benefits.map(([t, x]) => <div key={t} className="card card-pad stack reveal" style={{ ["--gap" as string]: "10px" }}><span className="icon-box"><Icon name={s.icon} /></span><h3 style={{ fontSize: 18 }}>{t}</h3><p className="muted small">{x}</p></div>)}
            </div>
            {d.tech?.length > 0 && <div className="tags reveal" style={{ marginTop: 32 }}>{d.tech.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
          </div>
        </section>
      )}
      {d?.faqs?.length > 0 && (
        <section className="section">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <div className="sec-head reveal"><span className="eyebrow">FAQ</span><h2>Common questions</h2></div>
            <div className="faq reveal">{d.faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="section section-alt">
          <div className="wrap">
            <div className="sec-head reveal"><span className="eyebrow">Related</span><h2>You may also need</h2></div>
            <div className="grid" style={{ ["--min" as string]: "280px" }}>
              {related.map((r) => <Link key={r.slug} href={`/services/${r.slug}`} className="card svc-card reveal"><span className="icon-box"><Icon name={r.icon} /></span><h3 style={{ fontSize: 18 }}>{r.title}</h3><p className="muted small">{r.short}</p><span className="more">Learn more →</span></Link>)}
            </div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
