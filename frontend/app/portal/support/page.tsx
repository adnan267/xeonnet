"use client";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useMe, useTitle } from "@/components/panel/AppShell";
import { company } from "@/lib/content";

export default function Support() {
  useTitle("Support");
  const { me } = useMe();
  const text = `Hello Xeon Net, this is ${me.client?.name || me.name}. I need help with: `;
  return (
    <div className="grid" style={{ ["--min" as string]: "260px", maxWidth: 900 }}>
      <a className="panel stack" href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><MessageCircle color="#25D366" /><b>WhatsApp</b><span className="muted small">Fastest reply · {company.phone}</span></a>
      <a className="panel stack" href={`tel:${company.phone_raw}`}><Phone /><b>Call us</b><span className="muted small">{company.hours}</span></a>
      <a className="panel stack" href={`mailto:${company.email}?subject=${encodeURIComponent("Support request")}`}><Mail /><b>Email</b><span className="muted small">{company.email}</span></a>
    </div>
  );
}
