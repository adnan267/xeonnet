import Link from "next/link";
import { Brand } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="stack" style={{ alignItems: "center", ["--gap" as string]: "20px", width: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between", width: "min(440px, 100%)" }}><Brand /><ThemeToggle /></div>
        <div className="card auth-card">{children}</div>
        <Link href="/" className="muted small">← Back to website</Link>
      </div>
    </div>
  );
}
