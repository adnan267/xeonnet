import { router } from "expo-router";
import { View } from "react-native";
import { Progress } from "@/components/bits";
import { Badge, Card, Empty, QueryState, Row, Screen, T } from "@/components/ui";
import { fdate } from "@/lib/format";
import { space } from "@/lib/theme";
import type { ProjectT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function PortalProjects() {
  const q = useQuery<ProjectT[]>("portal/projects");
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <QueryState q={q} />
      {q.data && (q.data.length ? (
        <View style={{ gap: space.sm }}>
          {q.data.map((p) => (
            <Card key={p.id} onPress={() => router.push(`/portal/project/${p.id}`)}>
              <Row style={{ justifyContent: "space-between" }}><T v="h3" style={{ flex: 1 }}>{p.title}</T><Badge status={p.status} /></Row>
              <Progress value={p.progress} />
              <T v="small" muted>{p.due_date ? `Target date ${fdate(p.due_date)}` : "Tap to see tasks and updates"}</T>
            </Card>
          ))}
        </View>
      ) : <Empty icon="briefcase-outline" title="No projects yet" text="When we start working on your project you can follow it here." />)}
    </Screen>
  );
}
