import type { Metadata } from "next";
import { PageHero } from "@/components/bits";
import { company } from "@/lib/content";
import VerifyClient from "../VerifyClient";

export const metadata: Metadata = { title: "Verify a Certificate", robots: { index: false } };

export default async function VerifyCode({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <>
      <PageHero eyebrow="Verification" title={<>Verify a <span className="accent">certificate</span></>}
        lead={`Check that a document was really issued by ${company.name}.`} />
      <VerifyClient initial={decodeURIComponent(code)} />
    </>
  );
}
