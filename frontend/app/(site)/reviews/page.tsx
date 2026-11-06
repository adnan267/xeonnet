import type { Metadata } from "next";
import { PageHero } from "@/components/bits";
import ReviewsClient from "./ReviewsClient";

export const metadata: Metadata = { title: "Reviews", description: "What clients say about Xeon Net." };

export default function Reviews() {
  return (
    <>
      <PageHero eyebrow="Reviews" title={<>What our <span className="accent">clients say</span></>} lead="Honest feedback from the people we work with. Worked with us? Leave a review below." />
      <ReviewsClient />
    </>
  );
}
