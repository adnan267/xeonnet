import type { CourseCard, CourseDetail, Lesson, PayInfo } from "./shared";

export type Enrollment = {
  id: number; course: number; course_title: string; status: "unpaid" | "review" | "active" | "completed" | "cancelled"; status_label: string;
  fee: string; created_at: string; activated_at: string | null; completed_at: string | null; progress: number;
  attempts_used: number; attempts_allowed: number; best_score: number | null; certificate: string;
};
export type TestStatus = { can_start: boolean; reason: string; attempts_used: number; attempts_allowed: number; lessons_done: number; lessons_total: number; pass_mark: number; time_limit: number | null; questions: number };
export type AttemptRow = { id: number; score: number | null; correct_count: number; total: number; passed: boolean; started_at: string; submitted_at: string | null };
export type Payment = { id: number; method: string; method_label: string; amount: string; reference: string; status: "pending" | "approved" | "rejected"; staff_note: string; created_at: string };
export type StudentCourse = {
  enrollment: Enrollment; course: CourseDetail; lessons: Lesson[]; done: number[]; test: TestStatus; attempts: AttemptRow[];
  payments: Payment[]; payment: PayInfo; certificate: { code: string } | null;
};
export type Home = { enrollments: (Enrollment & { course_detail: CourseCard })[] };
