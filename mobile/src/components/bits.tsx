import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { fdate, money, today } from "@/lib/format";
import { radius, useTheme } from "@/lib/theme";
import type { DocListItem, TaskT } from "@/lib/types";
import { Badge, ListItem, Row, T } from "./ui";

export function DocRow({ d, base = "/staff/document" }: { d: DocListItem; base?: string }) {
  const showBalance = d.doc_type === "invoice" && Number(d.totals.paid) > 0;
  return (
    <ListItem
      icon={d.doc_type === "invoice" ? "receipt-outline" : "document-text-outline"}
      title={d.client_name}
      sub={`${d.number}${d.title ? ` · ${d.title}` : ""} · ${fdate(d.issue_date)}`}
      right={<View style={{ alignItems: "flex-end", gap: 4 }}><T v="label">{money(showBalance ? d.totals.balance : d.totals.total, d.currency)}</T><Badge status={d.display_status} /></View>}
      onPress={() => router.push(`${base}/${d.id}`)}
    />
  );
}

export function Progress({ value }: { value: number }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <Row>
      <View style={{ flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: t.cardAlt, overflow: "hidden" }}>
        <View style={{ width: `${v}%`, height: "100%", backgroundColor: t.brand, borderRadius: radius.pill }} />
      </View>
      <T v="small" muted>{v}%</T>
    </Row>
  );
}

const NEXT: Record<TaskT["status"], TaskT["status"]> = { todo: "doing", doing: "done", done: "todo" };
export const nextStatus = (s: TaskT["status"]) => NEXT[s];

/** Task line; tapping the circle moves it To do → Doing → Done. */
export function TaskRow({ task, onToggle, showProject = true }: { task: TaskT; onToggle?: () => void; showProject?: boolean }) {
  const t = useTheme();
  const icon = task.status === "done" ? "checkmark-circle" : task.status === "doing" ? "time-outline" : "ellipse-outline";
  const color = task.status === "done" ? t.ok : task.status === "doing" ? t.info : t.faint;
  const late = !!task.due_date && task.status !== "done" && task.due_date < today();
  return (
    <ListItem
      left={<Pressable disabled={!onToggle} onPress={onToggle} hitSlop={12} accessibilityLabel="Change task status"><Ionicons name={icon} size={27} color={color} /></Pressable>}
      title={task.title}
      sub={[showProject ? task.project_title : "", task.assignee_detail?.name ?? "", task.due_date ? `due ${fdate(task.due_date)}` : ""].filter(Boolean).join(" · ")}
      right={<Badge status={late ? "overdue" : task.status} text={late ? "Late" : undefined} />}
    />
  );
}

export function Initials({ name }: { name: string }) {
  const t = useTheme();
  const i = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}><T v="label" brand>{i || "?"}</T></View>;
}
