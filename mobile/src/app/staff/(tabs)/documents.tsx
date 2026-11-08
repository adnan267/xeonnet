import { router } from "expo-router";
import { useState } from "react";
import { DocRow } from "@/components/bits";
import { Button, Empty, Field, ListCard, QueryState, Row, Screen, Segmented } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { DocListItem } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

type Kind = "all" | "invoice" | "proposal";
const STATUS = ["all", "draft", "sent", "partial", "overdue", "paid", "accepted", "rejected"] as const;

export default function Documents() {
  const { can } = useAuth();
  const [kind, setKind] = useState<Kind>("all");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");
  const [search, setSearch] = useState("");
  const path = `staff/documents?${kind !== "all" ? `type=${kind}&` : ""}status=${status}`;
  const q = useQuery<DocListItem[]>(path);
  const s = search.trim().toLowerCase();
  const list = (q.data ?? []).filter((d) => !s || [d.number, d.client_name, d.client_company, d.title].some((v) => v?.toLowerCase().includes(s)));
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      {can("documents", true) && (
        <Row>
          <Button title="Invoice" icon="add" kind="soft" small style={{ flex: 1 }} onPress={() => router.push({ pathname: "/staff/document/edit", params: { type: "invoice" } })} />
          <Button title="Proposal" icon="add" kind="soft" small style={{ flex: 1 }} onPress={() => router.push({ pathname: "/staff/document/edit", params: { type: "proposal" } })} />
        </Row>
      )}
      <Segmented value={kind} onChange={setKind} options={[{ value: "all", label: "All" }, { value: "invoice", label: "Invoices" }, { value: "proposal", label: "Proposals" }]} />
      <Segmented value={status} onChange={setStatus} options={STATUS.map((x) => ({ value: x, label: x === "all" ? "Any status" : x[0].toUpperCase() + x.slice(1) }))} />
      <Field label="Search" value={search} onChangeText={setSearch} placeholder="Number, client or title" />
      <QueryState q={q} />
      {q.data && (list.length ? <ListCard>{list.map((d) => <DocRow key={d.id} d={d} />)}</ListCard> : <Empty icon="receipt-outline" title="Nothing here" text="Try another filter." />)}
    </Screen>
  );
}
