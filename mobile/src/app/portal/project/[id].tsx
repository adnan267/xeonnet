import { Stack, useLocalSearchParams } from "expo-router";
import { DocRow, Progress } from "@/components/bits";
import { Badge, Card, Empty, KV, ListCard, ListItem, QueryState, Row, Screen, Section, T } from "@/components/ui";
import { ago, fdate } from "@/lib/format";
import type { DocListItem, ProjectT, UpdateT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

type Detail = ProjectT & { tasks: { id: number; title: string; status: string; due_date: string | null }[]; updates: UpdateT[]; documents: DocListItem[] };

export default function PortalProject() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery<Detail>(`portal/projects/${id}`);
  const p = q.data;
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <Stack.Screen options={{ title: p?.title ?? "Project" }} />
      <QueryState q={q} />
      {p && (
        <>
          <Card>
            <Row style={{ justifyContent: "space-between" }}><T v="h2" style={{ flex: 1 }}>{p.title}</T><Badge status={p.status} /></Row>
            {p.description ? <T muted>{p.description}</T> : null}
            <Progress value={p.progress} />
            <KV k="Started" v={fdate(p.start_date)} /><KV k="Target date" v={fdate(p.due_date)} /><KV k="Project manager" v={p.manager_detail?.name} />
          </Card>
          <Section title="Latest updates">
            {p.updates.length ? p.updates.map((u) => (
              <Card key={u.id} style={{ gap: 4 }}>
                <Row style={{ justifyContent: "space-between" }}><T v="label">{u.author_name || "Xeon Net"}</T><T v="tiny" faint>{ago(u.created_at)}</T></Row>
                <T>{u.text}</T>
              </Card>
            )) : <Empty icon="chatbox-outline" title="No updates yet" />}
          </Section>
          {p.tasks.length > 0 && (
            <Section title="Milestones">
              <ListCard>{p.tasks.map((x) => <ListItem key={x.id} icon={x.status === "done" ? "checkmark-circle-outline" : "ellipse-outline"} title={x.title} sub={x.due_date ? `due ${fdate(x.due_date)}` : undefined} right={<Badge status={x.status} />} />)}</ListCard>
            </Section>
          )}
          {p.documents.length > 0 && (
            <Section title="Proposals & invoices"><ListCard>{p.documents.map((d) => <DocRow key={d.id} d={d} base="/portal/document" />)}</ListCard></Section>
          )}
        </>
      )}
    </Screen>
  );
}
