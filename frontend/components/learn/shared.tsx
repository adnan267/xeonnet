"use client";
import { FileText, PlayCircle, Type } from "lucide-react";

export type CourseCard = { id: number; title: string; slug: string; category: string; level: string; summary: string; image_url: string; price: string; duration: string; lessons: number; minutes: number };
export type Lesson = { id: number; section: string; title: string; minutes: number | null; is_preview: boolean; kind: "video" | "text" | "file"; video_url?: string; body?: string; file_url?: string; file_label?: string };
export type CourseDetail = CourseCard & { description: string; outcomes: string; pass_mark: number; max_attempts: number; time_limit: number | null; questions: number; questions_per_test: number | null; syllabus: Lesson[] };
export type PayInfo = { instructions: string; bank: { label: string; value: string }[]; enroll_open: boolean; gateway: boolean };

export const rs = (v: string | number) => (Number(v) > 0 ? `Rs ${Number(v).toLocaleString("en-PK", { maximumFractionDigits: 0 })}` : "Free");
export const LEVEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const hours = (m: number) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} h` : `${m} min`);

export function KindIcon({ k }: { k: string }) {
  return k === "video" ? <PlayCircle size={16} /> : k === "file" ? <FileText size={16} /> : <Type size={16} />;
}

/** YouTube / Vimeo link → embeddable player URL (null if not recognised). */
export function embedUrl(url?: string) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function Video({ url, title }: { url: string; title: string }) {
  const src = embedUrl(url);
  if (!src) return <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noopener noreferrer">Watch video</a>;
  return (
    <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000" }}>
      <iframe src={src} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
    </div>
  );
}

/** Lessons grouped by their section heading. */
export function groupLessons<T extends { section: string }>(lessons: T[]) {
  const groups: { section: string; items: T[] }[] = [];
  for (const l of lessons) {
    const g = groups[groups.length - 1];
    if (g && g.section === l.section) g.items.push(l); else groups.push({ section: l.section, items: [l] });
  }
  return groups;
}

/** Enrolment status → colour class used by <Status>. */
export const ST: Record<string, string> = { unpaid: "overdue", review: "pending", active: "active", completed: "approved", cancelled: "cancelled" };
