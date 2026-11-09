import type { Metadata } from "next";
import CourseClient from "./CourseClient";

export const metadata: Metadata = { title: "Course" };

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CourseClient slug={slug} />;
}
