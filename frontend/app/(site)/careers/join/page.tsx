import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/bits";
import JoinForm from "./JoinForm";

export const metadata: Metadata = { title: "Join as a Remote Worker", description: "Join Xeon Net remote work for free." };

export default function Join() {
  return (
    <>
      <PageHero eyebrow="Remote work" title={<>Join <span className="accent">free</span></>} lead="Your account is ready as soon as you submit. Then pick your first task." />
      <section className="section-sm">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <Suspense fallback={<p className="muted">Loading…</p>}><JoinForm /></Suspense>
        </div>
      </section>
    </>
  );
}
