import type { Metadata } from "next";
import { PageHero } from "@/components/bits";
import { company } from "@/lib/content";
import CareersClient from "./CareersClient";

export const metadata: Metadata = {
  title: "Remote Jobs",
  description: `Work from home with ${company.name}: join free, do real tasks, earn coins and withdraw to JazzCash, Easypaisa or your bank.`,
};

export default function Careers() {
  return (
    <>
      <PageHero eyebrow="Careers · Remote work" title={<>Work from home with <span className="accent">{company.name}</span></>}
        lead="Join free, pick up real tasks from our projects, and get paid for every piece of work we approve. Withdraw to JazzCash, Easypaisa or your bank." />
      <CareersClient />
    </>
  );
}
