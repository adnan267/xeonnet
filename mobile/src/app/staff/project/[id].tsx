import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Progress, TaskRow, nextStatus } from "@/components/bits";
import { Alert, Badge, BottomSheet, Button, Card, DateField, Empty, Field, KV, ListCard, QueryState, Row, Screen, Section, Segmented, T, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ago, fdate } from "@/lib/format";
import { space } from "@/lib/theme";
import type { ProjectT, TaskT, UpdateT, UserMini } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function ProjectPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { can, user } = useAuth();
  const p = useQuery<ProjectT>(`staff/projects/${id}`);
  const tasks = useQuery<TaskT[]>(can("tasks") ? `staff/tasks?project=${id}` : null);
  const updates = useQuery<UpdateT[]>(can("tasks") ? `staff/projects/${id}/updates` : null);
  const people = useQuery<UserMini[]>("staff/people");
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [task, setTask] = useState({ title: "", assignee: "", due_date: "", priority: "normal", visible_to_client: true });

  async function toggle(x: TaskT) {
    if (!tasks.data) return;
    const status = nextStatus(x.status);
    tasks.setData(tasks.data.map((y) => (y.id === x.id ? { ...y, status } : y)));
    try { await api(`staff/tasks/${x.id}`, { method: "PATCH", body: { status } }); p.refresh(); } catch { tasks.refresh(); }
  }
  async function postUpdate() {
    setBusy("update"); setErr("");
    try { updates.setData(await api<UpdateT[]>(`staff/projects/${id}/updates`, { body: { text, visible_to_client: visible } })); setText(""); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }
  async function addTask() {
    setBusy("task"); setErr("");
    try {
      await api("staff/tasks", { body: { project: Number(id), title: task.title, assignee: task.assignee ? Number(task.assignee) : null, due_date: task.due_date || null, priority: task.priority, visible_to_client: task.visible_to_client } });
      setTaskOpen(false); setTask({ title: "", assignee: "", due_date: "", priority: "normal", visible_to_client: true }); tasks.refresh(); p.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }

  const x = p.data;
  return (
    <Screen refreshing={p.refreshing} onRefresh={() => { p.refresh(); tasks.refresh(); updates.refresh(); }}>
      <Stack.Screen options={{ title: x?.title ?? "Project" }} />
      <QueryState q={p} />
      {err ? <Alert text={err} /> : null}
      {x && (
        <>
          <Card>
            <Row style={{ justifyContent: "space-between" }}><T v="eyebrow" faint>{x.client_name}</T><Badge status={x.status} /></Row>
            <T v="h2">{x.title}</T>
            {x.description ? <T muted>{x.description}</T> : null}
            <Progress value={x.progress} />
            <KV k="Start" v={fdate(x.start_date)} /><KV k="Due" v={fdate(x.due_date)} />
            <KV k="Manager" v={x.manager_detail?.name} />
            <KV k="Team" v={x.members_detail.map((m) => m.name).join(", ")} />
            <KV k="Client can see it" v={x.visible_to_client ? "Yes" : "No"} />
          </Card>
          {can("tasks") && (
            <Section title="Tasks" action={can("tasks", true) ? <Button small kind="soft" icon="add" title="Task" onPress={() => setTaskOpen(true)} /> : undefined}>
              {tasks.data?.length ? <ListCard>{tasks.data.map((t) => <TaskRow key={t.id} task={t} showProject={false} onToggle={can("tasks", true) ? () => toggle(t) : undefined} />)}</ListCard>
                : <Empty icon="list-outline" title="No tasks yet" />}
            </Section>
          )}
          {can("tasks") && (
            <Section title="Updates">
              {can("tasks", true) && (
                <Card style={{ gap: space.sm }}>
                  <Field label="Post an update" value={text} onChangeText={setText} multiline placeholder="What changed? e.g. Homepage design approved." />
                  <Toggle title="Client can see this" sub="They get a notification on the Xeon Net app" value={visible} onChange={setVisible} />
                  <Button title="Post update" icon="send" small loading={busy === "update"} disabled={!text.trim()} onPress={postUpdate} />
                </Card>
              )}
              {(updates.data ?? []).map((u) => (
                <Card key={u.id} style={{ gap: 4 }}>
                  <Row style={{ justifyContent: "space-between" }}><T v="label">{u.author_name || "Xeon Net"}</T><T v="tiny" faint>{ago(u.created_at)}{u.visible_to_client ? "" : " · staff only"}</T></Row>
                  <T>{u.text}</T>
                </Card>
              ))}
            </Section>
          )}
        </>
      )}
      <BottomSheet visible={taskOpen} onClose={() => setTaskOpen(false)} title="New task">
        <Field label="Task *" value={task.title} onChangeText={(v) => setTask({ ...task, title: v })} />
        <View style={{ gap: 6 }}>
          <T v="label" muted>Assign to</T>
          <Segmented value={task.assignee} onChange={(v) => setTask({ ...task, assignee: v })}
            options={[{ value: "", label: "Nobody" }, ...(people.data ?? []).map((m) => ({ value: String(m.id), label: m.id === user?.id ? "Me" : m.name }))]} />
        </View>
        <DateField label="Due date" value={task.due_date} onChange={(v) => setTask({ ...task, due_date: v })} optional />
        <View style={{ gap: 6 }}>
          <T v="label" muted>Priority</T>
          <Segmented value={task.priority} onChange={(v) => setTask({ ...task, priority: v })} options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }]} />
        </View>
        <Toggle title="Client can see this task" value={task.visible_to_client} onChange={(v) => setTask({ ...task, visible_to_client: v })} />
        <Button title="Add task" icon="checkmark" loading={busy === "task"} disabled={!task.title.trim()} onPress={addTask} />
      </BottomSheet>
    </Screen>
  );
}
