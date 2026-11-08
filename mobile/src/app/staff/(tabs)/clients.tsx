import { router } from "expo-router";
import { useState } from "react";
import { Initials } from "@/components/bits";
import { Button, Empty, Field, ListCard, ListItem, QueryState, Screen, T } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { ClientT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function Clients() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const q = useQuery<ClientT[]>("staff/clients");
  const s = search.trim().toLowerCase();
  const list = (q.data ?? []).filter((c) => !s || [c.name, c.company, c.email, c.phone].some((v) => v?.toLowerCase().includes(s)));
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <Field label="Search" value={search} onChangeText={setSearch} placeholder="Name, company, email or phone" clearButtonMode="while-editing" />
      {can("clients", true) && <Button title="Add client" icon="person-add-outline" kind="soft" onPress={() => router.push("/staff/client/edit")} />}
      <QueryState q={q} />
      {q.data && (list.length ? (
        <ListCard>
          {list.map((c) => (
            <ListItem key={c.id} left={<Initials name={c.name} />} title={c.name}
              sub={[c.company, c.phone || c.email].filter(Boolean).join(" · ")}
              right={c.has_portal ? <T v="tiny" brand>Portal</T> : undefined}
              onPress={() => router.push(`/staff/client/${c.id}`)} />
          ))}
        </ListCard>
      ) : <Empty icon="people-outline" title={s ? "No match" : "No clients yet"} text={s ? "Try another name." : "Add your first client."} />)}
    </Screen>
  );
}
