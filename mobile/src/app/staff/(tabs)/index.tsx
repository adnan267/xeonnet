import { router } from "expo-router";
import { View } from "react-native";
import { DocRow, TaskRow, nextStatus } from "@/components/bits";
import { Button, Empty, ListCard, QueryState, Row, Screen, Section, Stat, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { space } from "@/lib/theme";
import type { Dashboard as D, TaskT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const q = useQuery<D>("staff/dashboard");
  const d = q.data;

  async function toggle(task: TaskT) {
    if (!d) return;
    const status = nextStatus(task.status);
    q.setData({ ...d, my_tasks: d.my_tasks.map((x) => (x.id === task.id ? { ...x, status } : x)) });
    try { await api(`staff/tasks/${task.id}`, { method: "PATCH", body: { status } }); } catch { q.refresh(); }
  }

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ gap: 2 }}>
        <T v="small" muted>{greeting()},</T>
        <T v="h1">{user?.first_name || user?.name}</T>
      </View>
      <QueryState q={q} />
      <Row wrap gap={space.sm}>
        {can("certificates", true) && <Button small kind="soft" icon="ribbon-outline" title="New certificate" onPress={() => router.push("/staff/certificate/new")} />}
        {can("documents", true) && <Button small kind="soft" icon="add" title="New invoice" onPress={() => router.push({ pathname: "/staff/document/edit", params: { type: "invoice" } })} />}
        {can("documents", true) && <Button small kind="soft" icon="add" title="New proposal" onPress={() => router.push({ pathname: "/staff/document/edit", params: { type: "proposal" } })} />}
        {can("clients", true) && <Button small kind="soft" icon="person-add-outline" title="New client" onPress={() => router.push("/staff/client/edit")} />}
      </Row>
      {d?.billing && (
        <Section title="Billing (PKR & other currencies combined)">
          <Row gap={space.sm}>
            <Stat title="Invoiced" value={money(d.billing.invoiced)} icon="receipt-outline" onPress={() => router.push("/staff/documents")} />
            <Stat title="Received" value={money(d.billing.received)} icon="cash-outline" tone="good" />
          </Row>
          <Row gap={space.sm}>
            <Stat title="Outstanding" value={money(d.billing.outstanding)} icon="hourglass-outline" tone="brand" />
            <Stat title="Overdue" value={String(d.billing.overdue)} icon="alert-circle-outline" tone={d.billing.overdue ? "bad" : "plain"} />
          </Row>
          <Row gap={space.sm}>
            <Stat title="Open proposals" value={String(d.billing.proposals_open)} icon="document-text-outline" />
            <Stat title="Won" value={String(d.billing.proposals_won)} icon="trophy-outline" tone="good" />
          </Row>
        </Section>
      )}
      {(d?.inbox || d?.projects || d?.certificates !== undefined) && (
        <Row gap={space.sm}>
          {d?.inbox && <Stat title="Unread messages" value={String(d.inbox.unread)} icon="mail-unread-outline" tone={d.inbox.unread ? "brand" : "plain"} onPress={() => router.push("/staff/inbox")} />}
          {d?.projects && <Stat title="Active projects" value={String(d.projects.active)} icon="briefcase-outline" onPress={() => router.push("/staff/work")} />}
          {d?.certificates !== undefined && !d?.inbox && <Stat title="Valid certificates" value={String(d.certificates)} icon="ribbon-outline" onPress={() => router.push("/staff/certificates")} />}
        </Row>
      )}
      {d && (
        <Section title="My tasks">
          {d.my_tasks.length ? <ListCard>{d.my_tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggle(task)} />)}</ListCard>
            : <Empty icon="checkmark-done-outline" title="Nothing on your list" text="Tasks assigned to you appear here." />}
        </Section>
      )}
      {d?.recent_documents?.length ? (
        <Section title="Recent proposals & invoices">
          <ListCard>{d.recent_documents.map((x) => <DocRow key={x.id} d={x} />)}</ListCard>
        </Section>
      ) : null}
    </Screen>
  );
}
