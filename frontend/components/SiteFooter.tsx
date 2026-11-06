import Link from "next/link";
import { allServices, company } from "@/lib/content";
import { FullLogo } from "./Logo";
import Subscribe from "./Subscribe";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div className="stack" style={{ ["--gap" as string]: "16px" }}>
          <FullLogo width={170} />
          <p className="muted small">IT services since {company.founded}. From basic support to full stack development and AI.</p>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/portfolio">Portfolio</Link></li>
            <li><Link href="/brands">Our Brands</Link></li>
            <li><Link href="/team">Team</Link></li>
            <li><Link href="/reviews">Reviews</Link></li>
            <li><Link href="/verify">Verify a Certificate</Link></li>
            <li><Link href="/login">Client / Staff Login</Link></li>
          </ul>
        </div>
        <div>
          <h4>Services</h4>
          <ul>{allServices.slice(3, 10).map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`}>{s.title}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a href={`tel:${company.phone_raw}`}>{company.phone}</a></li>
            <li><a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a></li>
            <li><a href={`mailto:${company.email}`}>{company.email}</a></li>
            <li>{company.address}</li>
            <li>{company.hours}</li>
          </ul>
          <div style={{ marginTop: 20 }}><Subscribe /></div>
        </div>
      </div>
      <div className="wrap bottom">
        <span>© {new Date().getFullYear()} {company.name} · CEO: {company.ceo} · Est. {company.founded}</span>
        <span>{company.domain}</span>
      </div>
    </footer>
  );
}
