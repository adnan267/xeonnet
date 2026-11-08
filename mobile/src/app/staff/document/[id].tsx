import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert as RNAlert, Linking, Share } from "react-native";
import DocView from "@/components/DocView";
import { Alert, BottomSheet, Button, DateField, Field, QueryState, Row, Screen, Segmented, Toggle } from "@/components/ui";
import { API_URL, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money, today } from "@/lib/format";
import { documentHtml, sharePdf } from "@/lib/pdf";
import { space } from "@/lib/theme";
import type { Doc } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

const METHODS = ["Bank transfer", "Cash", "Cheque", "JazzCash", "Easypaisa", "Card / Online", "Other"];
type Sent = { channel: string; status: string; to?: string; error?: string }[];

function sentText(sent: Sent, what: string) {
  const ok = sent.filter((s) => s.status === "sent").map((s) => s.channel);
  const bad = sent.filter((s) => s.status !== "sent");
  if (!sent.length) return `${what}. No email or SMS was sent (turned off for this client, or no contact details).`;
  return `${what}.${ok.length ? ` Sent by ${ok.join(" & ")}.` : ""}${bad.length ? ` Not sent: ${bad.map((b) => `${b.channel} (${b.error || b.status})`).join(", ")}.` : ""}`;
}

export default function DocumentPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { can } = useAuth();
  const q = useQuery<Doc>(`staff/documents/${id}`);
  const d = q.data;
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: "", paid_on: today(), method: "Bank transfer", note: "", notify: true });
  const write = can("documents", true);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(""); }
  }
  const send = () => run("send", async () => {
    const r = await api<{ document: Doc; sent: Sent }>(`staff/documents/${id}/send`, { body: { notify: true } });
    q.setData(r.document); setMsg({ ok: true, text: sentText(r.sent, `${r.document.number} marked as sent`) });
  });
  const setStatus = (status: string) => run(status, async () => { q.setData(await api<Doc>(`staff/documents/${id}/set_status`, { body: { status } })); });
  const convert = () => run("convert", async () => { const inv = await api<Doc>(`staff/documents/${id}/convert`, { body: {} }); router.push(`/staff/document/${inv.id}`); });
  const duplicate = () => run("duplicate", async () => { const c = await api<Doc>(`staff/documents/${id}/duplicate`, { body: {} }); router.push(`/staff/document/${c.id}`); });
  const share = () => run("pdf", async () => { if (d) await sharePdf("document", documentHtml(d), `${d.number} ${d.client_detail.name}`); });
  const shareLink = () => { if (d?.token) Share.share({ message: `${d.doc_type === "invoice" ? "Invoice" : "Proposal"} ${d.number} from Xeon Net: ${API_URL}/d/${d.token}` }); };
  const savePayment = () => run("pay", async () => {
    const r = await api<{ document: Doc; sent: Sent }>(`staff/documents/${id}/payments`, { body: pay });
    q.setData(r.document); setPayOpen(false);
    setMsg({ ok: true, text: sentText(r.sent, `Payment of ${money(pay.amount, r.document.currency)} recorded`) });
    setPay({ amount: "", paid_on: today(), method: "Bank transfer", note: "", notify: true });
  });

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}
      footer={d ? (
        <Row>
          <Button title="Share PDF" icon="share-outline" loading={busy === "pdf"} onPress={share} style={{ flex: 1 }} />
          {d.doc_type === "invoice" && can("payments", true) && d.status !== "cancelled" && Number(d.totals.balance) > 0 &&
            <Button title="Add payment" kind="dark" icon="cash-outline" onPress={() => { setPay((p) => ({ ...p, amount: d.totals.balance })); setPayOpen(true); }} style={{ flex: 1 }} />}
        </Row>
      ) : undefined}>
      <Stack.Screen options={{ title: d?.number ?? "", headerRight: () => (write && d ? <Button small kind="ghost" title="Edit" onPress={() => router.push({ pathname: "/staff/document/edit", params: { id } })} /> : null) }} />
      <QueryState q={q} />
      {msg && <Alert kind={msg.ok ? "ok" : "bad"} text={msg.text} />}
      {d && (
        <>
          {write && (
            <Row wrap gap={space.sm}>
              {d.status !== "cancelled" && <Button small kind="soft" icon="send-outline" title={d.status === "draft" ? "Send to client" : "Send again"} loading={busy === "send"} onPress={() =>
                RNAlert.alert(`Send ${d.number}?`, `${d.client_detail.name} gets an email / SMS with a link to view it.`, [{ text: "Cancel", style: "cancel" }, { text: "Send", onPress: send }])} />}
              {d.token && <Button small kind="soft" icon="link-outline" title="Share link" onPress={shareLink} />}
              {d.token && <Button small kind="soft" icon="globe-outline" title="Open online" onPress={() => Linking.openURL(`${API_URL}/d/${d.token}`)} />}
              {d.doc_type === "proposal" && d.status === "sent" && <Button small kind="soft" icon="checkmark" title="Mark accepted" loading={busy === "accepted"} onPress={() => setStatus("accepted")} />}
              {d.doc_type === "proposal" && d.status === "sent" && <Button small kind="danger" title="Mark rejected" loading={busy === "rejected"} onPress={() => setStatus("rejected")} />}
              {d.doc_type === "proposal" && <Button small kind="soft" icon="swap-horizontal" title="Make invoice" loading={busy === "convert"} onPress={convert} />}
              <Button small kind="soft" icon="copy-outline" title="Duplicate" loading={busy === "duplicate"} onPress={duplicate} />
              {d.doc_type === "invoice" && d.status !== "cancelled" && <Button small kind="danger" title="Cancel invoice" onPress={() =>
                RNAlert.alert("Cancel invoice?", "It will no longer count as money owed.", [{ text: "Keep", style: "cancel" }, { text: "Cancel invoice", style: "destructive", onPress: () => setStatus("cancelled") }])} />}
            </Row>
          )}
          <DocView d={d} />
        </>
      )}
      <BottomSheet visible={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <Field label={`Amount (${d?.currency ?? ""})`} value={pay.amount} onChangeText={(v) => setPay({ ...pay, amount: v.replace(/[^\d.]/g, "") })} keyboardType="decimal-pad" />
        <DateField label="Paid on" value={pay.paid_on} onChange={(v) => setPay({ ...pay, paid_on: v })} />
        <Segmented value={pay.method} onChange={(v) => setPay({ ...pay, method: v })} options={METHODS.map((m) => ({ value: m, label: m }))} />
        <Field label="Note / reference" value={pay.note} onChangeText={(v) => setPay({ ...pay, note: v })} />
        <Toggle title="Send receipt to client" sub="Email / SMS thank-you with the remaining balance" value={pay.notify} onChange={(v) => setPay({ ...pay, notify: v })} />
        <Button title="Save payment" icon="checkmark" loading={busy === "pay"} disabled={!Number(pay.amount)} onPress={savePayment} />
      </BottomSheet>
    </Screen>
  );
}
