import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Progress, TaskRow, nextStatus } from "@/components/bits";
import { Badge, Card, Empty, ListCard, QueryState, Row, Screen, Segmented, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fdate } from "@/lib/format";
import { space } from "@/lib/theme";
import type { ProjectT, TaskT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function Work() {
  const { can } = useAuth();
  const [view, setView] = useState<"tasks" | "projects">(can("tasks") ? "tasks" : "projects");
  const [taskFilter, setTaskFilter] = useState<"mine" | "open" | "done">("mine");
  const tasks = useQuery<TaskT[]>(view === "tasks" ? `staff/tasks?${taskFilter === "mine" ? "mine=1" : taskFilter === "done" ? "status=done" : ""}` : null);
  const projects = useQuery<ProjectT[]>(view === "projects" ? "staff/projects?status=all" : null);

  async function toggle(task: TaskT) {
    if (!tasks.data) return;
    const status = nextStatus(task.status);
    tasks.setData(tasks.data.map((x) => (x.id === task.id ? { ...x, status } : x)));
    try { await api(`staff/tasks/${task.id}`, { method: "PATCH", body: { status } }); } catch { tasks.refresh(); }
  }

  const q = view === "tasks" ? tasks : projects;
  const openTasks = (tasks.data ?? []).filter((x) => taskFilter === "done" || x.status !== "done");
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <Segmented value={view} onChange={setView} options={[...(can("tasks") ? [{ value: "tasks" as const, label: "Tasks" }] : []), { value: "projects" as const, label: "Projects" }]} />
      {view === "tasks" && <Segmented value={taskFilter} onChange={setTaskFilter} options={[{ value: "mine", label: "Mine" }, { value: "open", label: "All open" }, { value: "done", label: "Done" }]} />}
      <QueryState q={q} />
      {view === "tasks" && tasks.data && (openTasks.length
        ? <ListCard>{openTasks.map((x) => <TaskRow key={x.id} task={x} onToggle={can("tasks", true) ? () => toggle(x) : undefined} />)}</ListCard>
        : <Empty icon="checkmark-done-outline" title="No tasks here" text="Tap the circle on a task to move it To do → Doing → Done." />)}
      {view === "projects" && projects.data && (projects.data.length ? (
        <View style={{ gap: space.sm }}>
          {projects.data.map((p) => (
            <Card key={p.id} onPress={() => router.push(`/staff/project/${p.id}`)}>
              <Row style={{ justifyContent: "space-between" }}><T v="eyebrow" faint numberOfLines={1} style={{ flex: 1 }}>{p.client_name}</T><Badge status={p.status} /></Row>
              <T v="h3">{p.title}</T>
              <Progress value={p.progress} />
              <T v="small" muted>{p.task_counts.done}/{p.task_counts.todo + p.task_counts.doing + p.task_counts.done} tasks done{p.due_date ? ` · due ${fdate(p.due_date)}` : ""}{p.manager_detail ? ` · ${p.manager_detail.name}` : ""}</T>
            </Card>
          ))}
        </View>
      ) : <Empty icon="briefcase-outline" title="No projects" />)}
    </Screen>
  );
}
