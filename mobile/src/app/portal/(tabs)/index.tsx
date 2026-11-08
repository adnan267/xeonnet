import { router } from "expo-router";
import { Linking, View } from "react-native";
import { DocRow, Progress } from "@/components/bits";
import { Badge, Button, Card, Empty, ListCard, QueryState, Row, Screen, Section, T } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { company } from "@/lib/content";
import { money } from "@/lib/format";
import { space, useTheme } from "@/lib/theme";
import type { ClientT, DocListItem, ProjectT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

type Summary = { client: ClientT; outstanding: Record<string, string>; documents: DocListItem[]; projects: ProjectT[] };

export default function Overview() {
  const t = useTheme();
  const { user } = useAuth();
  const q = useQuery<Summary>("portal/summary");
  const s = q.data;
  const owed = Object.entries(s?.outstanding ?? {});
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={{ gap: 2 }}>
        <T v="small" muted>Welcome,</T>
        <T v="h1">{user?.first_name || s?.client.name || user?.name}</T>
        {s?.client.company ? <T muted>{s.client.company}</T> : null}
      </View>
      <QueryState q={q} />
      {s && (
        <>
          <Card style={{ backgroundColor: owed.length ? t.ink : t.okSoft, borderColor: owed.length ? t.ink : t.okSoft }}>
            <T v="small" style={{ color: owed.length ? "rgba(255,255,255,.7)" : t.ok }}>{owed.length ? "Amount to pay" : "Your account"}</T>
            {owed.length ? owed.map(([cur, v]) => <T key={cur} v="display" style={{ color: "#fff" }}>{money(v, cur)}</T>)
              : <T v="h2" style={{ color: t.ok }}>All paid. Thank you!</T>}
            {owed.length ? <Button title="See invoices" kind="primary" small style={{ alignSelf: "flex-start", marginTop: space.sm }} onPress={() => router.push("/portal/documents")} /> : null}
          </Card>
          <Section title="Projects">
            {s.projects.length ? s.projects.map((p) => (
              <Card key={p.id} onPress={() => router.push(`/portal/project/${p.id}`)}>
                <Row style={{ justifyContent: "space-between" }}><T v="h3" style={{ flex: 1 }}>{p.title}</T><Badge status={p.status} /></Row>
                <Progress value={p.progress} />
              </Card>
            )) : <Empty icon="briefcase-outline" title="No projects yet" />}
          </Section>
          <Section title="Recent proposals & invoices">
            {s.documents.length ? <ListCard>{s.documents.map((d) => <DocRow key={d.id} d={d} base="/portal/document" />)}</ListCard> : <Empty title="Nothing yet" />}
          </Section>
          <Card>
            <T v="h3">Need help?</T>
            <T v="small" muted>Your Xeon Net team is a message away.</T>
            <Row>
              <Button small kind="soft" icon="logo-whatsapp" title="WhatsApp" style={{ flex: 1 }} onPress={() => Linking.openURL(`https://wa.me/${company.whatsapp}`)} />
              <Button small kind="soft" icon="call-outline" title="Call" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${company.phone_raw}`)} />
            </Row>
          </Card>
        </>
      )}
    </Screen>
  );
}
