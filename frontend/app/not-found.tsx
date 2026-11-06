import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="section center">
        <div className="wrap stack" style={{ alignItems: "center", ["--gap" as string]: "18px" }}>
          <span className="eyebrow">404</span>
          <h1 className="h1">Page not found</h1>
          <p className="lead">The page you are looking for has moved or does not exist.</p>
          <div className="row" style={{ justifyContent: "center" }}><Link href="/" className="btn">Go home</Link><Link href="/contact" className="btn btn-ghost">Contact us</Link></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
