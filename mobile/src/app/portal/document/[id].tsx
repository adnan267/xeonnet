import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert as RNAlert } from "react-native";
import DocView from "@/components/DocView";
import { Alert, Button, QueryState, Row, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { documentHtml, sharePdf } from "@/lib/pdf";
import type { Doc } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

export default function PortalDocument() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery<Doc>(`portal/documents/${id}`);
  const d = q.data;
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function accept() {
    setBusy("accept"); setMsg(null);
    try { q.setData(await api<Doc>(`portal/documents/${id}/accept`, { body: {} })); setMsg({ ok: true, text: "Thank you! The proposal is accepted. Our team has been notified." }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(""); }
  }

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}
      footer={d ? (
        <Row>
          <Button title="Share PDF" icon="share-outline" kind={d.doc_type === "proposal" && d.status === "sent" ? "ghost" : "primary"} loading={busy === "pdf"} style={{ flex: 1 }}
            onPress={async () => { setBusy("pdf"); try { await sharePdf("document", documentHtml(d), `${d.number} Xeon Net`); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(""); } }} />
          {d.doc_type === "proposal" && d.status === "sent" && (
            <Button title="Accept proposal" icon="checkmark-circle-outline" loading={busy === "accept"} style={{ flex: 1.2 }}
              onPress={() => RNAlert.alert("Accept this proposal?", `You agree to ${d.number}${d.title ? ` (${d.title})` : ""} and its terms.`, [{ text: "Cancel", style: "cancel" }, { text: "Accept", onPress: accept }])} />
          )}
        </Row>
      ) : undefined}>
      <Stack.Screen options={{ title: d?.number ?? "" }} />
      <QueryState q={q} />
      {msg && <Alert kind={msg.ok ? "ok" : "bad"} text={msg.text} />}
      {d && <DocView d={d} />}
    </Screen>
  );
}
