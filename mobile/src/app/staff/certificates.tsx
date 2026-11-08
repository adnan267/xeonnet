import { router } from "expo-router";
import { useState } from "react";
import { Badge, Button, Empty, Field, ListCard, ListItem, QueryState, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { fdate } from "@/lib/format";
import type { Cert } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function Certificates() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const q = useQuery<Cert[]>(`staff/certificates${search.trim().length > 1 ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      {can("certificates", true) && <Button title="New internship certificate" icon="ribbon-outline" onPress={() => router.push("/staff/certificate/new")} />}
      <Field label="Search" value={search} onChangeText={setSearch} placeholder="Name, number or field" autoCapitalize="none" />
      <QueryState q={q} />
      {q.data && (q.data.length ? (
        <ListCard>
          {q.data.map((c) => (
            <ListItem key={c.id} icon="ribbon-outline" title={c.holder_name} sub={`${c.code} · ${c.title || c.doc_type} · ${fdate(c.issued_on)}`}
              right={<Badge status={c.status ?? "valid"} />} onPress={() => router.push(`/staff/certificate/${c.id}`)} />
          ))}
        </ListCard>
      ) : <Empty icon="ribbon-outline" title="No certificates" text="Issue your first internship certificate." />)}
    </Screen>
  );
}
