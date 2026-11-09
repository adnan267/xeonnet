import type { Metadata } from "next";
import { PageHero } from "@/components/bits";
import { company } from "@/lib/content";
import CoursesClient from "./CoursesClient";

export const metadata: Metadata = {
  title: "Online Courses",
  description: `Learn practical IT and digital skills online with ${company.name}. Lessons, guidance, a final test and a verifiable certificate.`,
};

export default function Courses() {
  return (
    <>
      <PageHero eyebrow="Online learning" title={<>Learn skills that <span className="accent">get you hired</span></>}
        lead="Video lessons and step-by-step guidance from the Xeon Net team. Pass the final test and get a certificate anyone can verify online." />
      <CoursesClient />
    </>
  );
}
