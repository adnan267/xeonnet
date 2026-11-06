import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone, User } from "lucide-react";
import { PageHero, Photo } from "@/components/bits";
import { allServices, company } from "@/lib/content";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact", description: `Call, WhatsApp or message ${company.name}.` };

export default function Contact() {
  const items = [
    [Phone, <a key="p" href={`tel:${company.phone_raw}`}>{company.phone}</a>],
    [MessageCircle, <a key="w" href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener">WhatsApp: {company.phone}</a>],
    [Mail, <a key="e" href={`mailto:${company.email}`}>{company.email}</a>],
    [MapPin, company.address], [Clock, company.hours], [User, `CEO: ${company.ceo}`],
  ] as const;
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Let&apos;s start your <span className="accent">project</span></>} lead="Fill in the form or call and message us directly. We reply quickly." />
      <section className="section">
        <div className="wrap hero-grid" style={{ alignItems: "start", gap: 48 }}>
          <div className="stack reveal" style={{ ["--gap" as string]: "24px" }}>
            <h2 className="h3">Get in touch</h2>
            <ul className="check-list" style={{ fontWeight: 600 }}>
              {items.map(([I, text], i) => <li key={i}><I />{text}</li>)}
            </ul>
            <Photo k="contact" alt="Laptop and smartphone on a desk" h={300} />
          </div>
          <ContactForm services={allServices.map((s) => s.title)} />
        </div>
      </section>
    </>
  );
}
