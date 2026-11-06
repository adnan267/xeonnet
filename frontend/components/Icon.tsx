// Server component: renders a Lucide icon by its kebab-case name ("shield-check").
import { icons } from "lucide-react";

const alias: Record<string, string> = { "code-xml": "CodeXml", "brain-circuit": "BrainCircuit" };

export default function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const key = alias[name] || name.split("-").map((p) => p[0]?.toUpperCase() + p.slice(1)).join("");
  const C = (icons as Record<string, any>)[key] || icons.Sparkles;
  return <C size={size} className={className} aria-hidden="true" />;
}
