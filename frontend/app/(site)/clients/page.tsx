import type { Metadata } from "next";
import Icon from "@/components/Icon";
import { CtaBand, PageHero } from "@/components/bits";
import { company, industries } from "@/lib/content";
import fs from "node:fs";
import path from "node:path";

export const metadata: Metadata = { title: "Clients", description: `Industries and businesses served by ${company.name}.` };

function logos() {
  // Put client logo files in public/img/clients — they appear here automatically.
  const dir = path.join(process.cwd(), "public", "img", "clients");
  try {
    return fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f)).sort()
      .map((f) => ({ src: `/img/clients/${f}`, name: f.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") }));
  } catch { return []; }
}

export default function Clients() {
  const list = logos();
  return (
    <>
      <PageHero eyebrow="Clients" title={<>Trusted by businesses <span className="accent">since {company.founded}</span></>}
        lead="From small offices to growing companies, across many industries in Pakistan and abroad." />
      {list.length > 0 && (
        <section className="section-sm">
          <div className="wrap grid" style={{ ["--min" as string]: "160px", ["--gap" as string]: "16px" }}>
            {list.map((l) => <div key={l.src} className="card reveal" style={{ padding: 24, display: "grid", placeItems: "center", height: 110 }}><img src={l.src} alt={l.name} style={{ maxHeight: 60, width: "auto" }} /></div>)}
          </div>
        </section>
      )}
      <section className="section">
        <div className="wrap">
          <div className="sec-head reveal"><span className="eyebrow">Industries</span><h2>Who we work with</h2></div>
          <div className="grid" style={{ ["--min" as string]: "260px" }}>
            {industries.map((x) => <div key={x.title} className="card card-pad stack reveal" style={{ ["--gap" as string]: "12px" }}><span className="icon-box"><Icon name={x.icon} /></span><h3 style={{ fontSize: 18 }}>{x.title}</h3><p className="muted small">{x.text}</p></div>)}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
