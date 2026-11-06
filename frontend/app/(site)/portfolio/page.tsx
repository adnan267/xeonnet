import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageHero, Photo } from "@/components/bits";
import { catPhoto, portfolio } from "@/lib/content";

export const metadata: Metadata = { title: "Portfolio", description: "Websites, apps, e-commerce and software built by Xeon Net." };

export default function Portfolio() {
  return (
    <>
      <PageHero eyebrow="Portfolio" title={<>Work we&apos;re <span className="accent">proud of</span></>} lead="A selection of the websites, apps and systems we have designed and built." />
      <section className="section">
        <div className="wrap grid" style={{ ["--min" as string]: "340px", ["--gap" as string]: "32px" }}>
          {portfolio.map((p) => (
            <Link key={p.slug} href={`/portfolio/${p.slug}`} className="card reveal" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {p.images?.[0] ? <div className="photo" style={{ height: 240, borderRadius: 0 }}><img src={p.images[0]} alt="" /></div> : <Photo k={catPhoto(p.category)} alt="" h={240} w={800} style={{ borderRadius: 0 }} />}
              <div className="stack" style={{ padding: 24, ["--gap" as string]: "10px" }}>
                <div className="row between"><span className="eyebrow" style={{ fontSize: 12 }}>{p.category}</span>{p.sample && <span className="pill">Sample</span>}</div>
                <h3 style={{ fontSize: 21 }}>{p.title}</h3>
                <p className="muted small">{p.summary}</p>
                <span className="accent" style={{ fontWeight: 700, fontSize: 14 }}>Case study →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand title="Your project could be next." />
    </>
  );
}
