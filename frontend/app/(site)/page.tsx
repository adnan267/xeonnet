import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Icon from "@/components/Icon";
import { CeoQuote, Checks, CtaBand, Photo } from "@/components/bits";
import { allServices, brands, catPhoto, company, faqs, portfolio, processSteps, tech, tiers, whyUs, years } from "@/lib/content";

const featured = ["web-development", "mobile-apps", "ecommerce", "cloud-devops", "cyber-security", "digital-marketing"];

export default function Home() {
  const services = featured.map((slug) => allServices.find((s) => s.slug === slug)!).filter(Boolean);
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="stack" style={{ ["--gap" as string]: "24px" }}>
            <span className="eyebrow reveal"><span className="dot" />Your IT partner since {company.founded}</span>
            <h1 className="h1 reveal">Technology that helps your business <span className="accent">grow.</span></h1>
            <p className="lead reveal" style={{ maxWidth: 540 }}>From networks and hosting to websites, apps, cloud and AI — {company.name} plans, builds and supports the technology behind your business.</p>
            <div className="row reveal">
              <Link href="/contact" className="btn">Start a Project <ArrowRight /></Link>
              <Link href="/about" className="btn btn-ghost">Our Story</Link>
            </div>
            <div className="stats reveal" style={{ paddingTop: 12 }}>
              <div><b>{years}+</b><span>Years in IT</span></div>
              <div><b>{allServices.length}+</b><span>IT services</span></div>
              <div><b>24/7</b><span>Support</span></div>
            </div>
          </div>
          <div className="hero-visual reveal">
            <Photo k="hero" alt="A team of developers working together on laptops" w={1400} />
            <div className="card float f1">
              <span className="icon-box" style={{ width: 40, height: 40 }}><ShieldCheck /></span>
              <div><b style={{ fontSize: 15 }}>Secure &amp; scalable</b><p className="muted small">Built to grow with you</p></div>
            </div>
            <div className="card float f2">
              <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}>Since</span>
              <b style={{ fontSize: 32 }} className="accent">{company.founded}</b>
            </div>
          </div>
        </div>
      </section>

      <div className="strip" aria-hidden="true">
        <div className="marquee">{[...tech, ...tech].map((t, i) => <span key={i}>{t}</span>)}</div>
      </div>

      <section className="section" id="services">
        <div className="wrap">
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 48 }}>
            <div className="sec-head reveal" style={{ marginBottom: 0 }}>
              <span className="eyebrow">What we do</span>
              <h2>Everything IT, from basic to advanced</h2>
            </div>
            <Link href="/services" className="btn btn-ghost reveal">All {allServices.length} services</Link>
          </div>
          <div className="grid" style={{ ["--min" as string]: "320px" }}>
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="card svc-photo-card reveal">
                <Photo k={s.slug} alt="" w={700} />
                <div className="body">
                  <span className="icon-box" style={{ marginTop: -48, position: "relative", border: "4px solid var(--surface)", background: "var(--surface-2)" }}><Icon name={s.icon} /></span>
                  <h3 className="h3" style={{ fontSize: 20 }}>{s.title}</h3>
                  <p className="muted" style={{ fontSize: 15 }}>{s.short}</p>
                  <span className="more" style={{ marginTop: "auto", fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>Learn more →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="about">
        <div className="wrap hero-grid" style={{ gap: 64 }}>
          <Photo k="about" alt="Xeon Net team discussing a project at a table with laptops" h={460} className="reveal" />
          <div className="stack reveal" style={{ ["--gap" as string]: "20px" }}>
            <span className="eyebrow">About {company.name}</span>
            <h2 className="h2">From the first network cable to AI</h2>
            <p className="lead" style={{ fontSize: 17 }}>Since {company.founded} we have grown from basic IT services into a full stack development and digital solutions company. Long experience, combined with modern skills, under one roof.</p>
            <Checks items={tiers.map((t) => `${t.name}: ${t.intro}`)} />
            <div><Link href="/about" className="btn btn-ghost">More about us</Link></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head center center reveal"><span className="eyebrow">Why {company.name}</span><h2>{years} years of trust, today&apos;s technology</h2></div>
          <div className="grid" style={{ ["--min" as string]: "250px" }}>
            {whyUs.map((w) => (
              <div key={w.title} className="card card-pad stack reveal" style={{ ["--gap" as string]: "12px" }}>
                <span className="icon-box"><Icon name={w.icon} /></span>
                <h3 style={{ fontSize: 18 }}>{w.title}</h3>
                <p className="muted small">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head center reveal"><span className="eyebrow">Portfolio</span><h2>Featured work</h2></div>
          <div className="grid" style={{ ["--min" as string]: "330px" }}>
            {portfolio.slice(0, 3).map((p) => (
              <Link key={p.slug} href={`/portfolio/${p.slug}`} className="stack reveal" style={{ ["--gap" as string]: "16px" }}>
                <Photo k={catPhoto(p.category)} alt="" h={260} w={800} />
                <div className="row between" style={{ alignItems: "baseline" }}>
                  <h3 style={{ fontSize: 20 }}>{p.title}</h3>
                  <span className="muted small" style={{ fontWeight: 700 }}>{p.category}</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="center reveal" style={{ marginTop: 40 }}><Link href="/portfolio" className="btn btn-ghost">View full portfolio</Link></p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <div className="sec-head reveal"><span className="eyebrow">How we work</span><h2>A simple, clear process</h2></div>
          <ol className="process">
            {processSteps.map(([t, x], i) => (
              <li key={t} className="reveal"><span className="n">{String(i + 1).padStart(2, "0")}</span><h3 style={{ fontSize: 19 }}>{t}</h3><p className="muted small">{x}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="brands">
        <div className="wrap stack" style={{ ["--gap" as string]: "28px" }}>
          <div className="row between">
            <span className="eyebrow">Our own businesses</span>
            <Link href="/brands" className="link">All brands →</Link>
          </div>
          <div className="grid" style={{ ["--min" as string]: "250px", ["--gap" as string]: "16px" }}>
            {brands.map((b) => (
              <Link key={b.slug} href={`/brands#${b.slug}`} className="card reveal row" style={{ padding: 20, flexWrap: "nowrap", ["--gap" as string]: "14px" }}>
                <span className="icon-box"><Icon name={b.icon} /></span>
                <span><b style={{ display: "block" }}>{b.name}</b><span className="muted small">{b.industry}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CeoQuote />

      <section className="section">
        <div className="wrap hero-grid" style={{ alignItems: "start" }}>
          <div className="stack reveal" style={{ ["--gap" as string]: "16px" }}>
            <span className="eyebrow">FAQ</span>
            <h2 className="h2">Questions? Answered.</h2>
            <p className="muted">Can&apos;t find what you need? Call or WhatsApp us on {company.phone}.</p>
            <div><Link href="/contact" className="btn">Ask us anything <ArrowRight /></Link></div>
          </div>
          <div className="faq reveal">
            {faqs.slice(0, 6).map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
