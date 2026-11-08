import { useState } from "react";
import { DocRow } from "@/components/bits";
import { Empty, ListCard, QueryState, Screen, Segmented } from "@/components/ui";
import type { DocListItem } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function PortalDocuments() {
  const [type, setType] = useState<"invoice" | "proposal">("invoice");
  const q = useQuery<DocListItem[]>(`portal/documents?type=${type}`);
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <Segmented value={type} onChange={setType} options={[{ value: "invoice", label: "Invoices" }, { value: "proposal", label: "Proposals" }]} />
      <QueryState q={q} />
      {q.data && (q.data.length ? <ListCard>{q.data.map((d) => <DocRow key={d.id} d={d} base="/portal/document" />)}</ListCard>
        : <Empty icon="receipt-outline" title={`No ${type}s yet`} />)}
    </Screen>
  );
}
