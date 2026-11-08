import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert as RNAlert, Linking, Share, View } from "react-native";
import { DocRow } from "@/components/bits";
import { Action, Alert, Button, Card, Empty, KV, ListCard, QueryState, Row, Screen, Section, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { space } from "@/lib/theme";
import type { ClientT, DocListItem } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

const digits = (p: string) => p.replace(/[^\d+]/g, "");
const wa = (p: string) => { let d = p.replace(/\D/g, ""); if (d.startsWith("0")) d = "92" + d.slice(1); return d; };

export default function ClientPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { can } = useAuth();
  const c = useQuery<ClientT>(`staff/clients/${id}`);
  const docs = useQuery<DocListItem[]>(can("documents") ? `staff/documents?client=${id}` : null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const x = c.data;

  async function invite() {
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ link: string; sent: { channel: string; status: string }[] }>(`staff/clients/${id}/invite`, { body: {} });
      const sent = r.sent.filter((s) => s.status === "sent").map((s) => s.channel).join(" & ");
      setMsg({ ok: true, text: sent ? `Portal invite sent by ${sent}.` : "Portal login created. Share the set-password link with the client." });
      if (!sent) Share.share({ message: `Your Xeon Net client portal: set your password here ${r.link}` });
      c.refresh();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  }

  return (
    <Screen refreshing={c.refreshing} onRefresh={() => { c.refresh(); docs.refresh(); }}>
      <Stack.Screen options={{ title: x?.name ?? "Client", headerRight: () => can("clients", true) && x ? <Button small kind="ghost" title="Edit" onPress={() => router.push({ pathname: "/staff/client/edit", params: { id } })} /> : null }} />
      <QueryState q={c} />
      {x && (
        <>
          <View style={{ gap: 4 }}>
            <T v="h1">{x.name}</T>
            {x.company ? <T muted>{x.company}</T> : null}
          </View>
          <Card>
            <Row style={{ justifyContent: "space-around" }}>
              {x.phone ? <Action icon="call-outline" title="Call" onPress={() => Linking.openURL(`tel:${digits(x.phone)}`)} /> : null}
              {x.phone ? <Action icon="logo-whatsapp" title="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${wa(x.phone)}`)} /> : null}
              {x.email ? <Action icon="mail-outline" title="Email" onPress={() => Linking.openURL(`mailto:${x.email}`)} /> : null}
              {x.address ? <Action icon="location-outline" title="Map" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(x.address)}`)} /> : null}
            </Row>
          </Card>
          <Card style={{ gap: 2 }}>
            <KV k="Email" v={x.email} /><KV k="Phone" v={x.phone} /><KV k="Country" v={x.country} /><KV k="Address" v={x.address} />
            <KV k="Payment emails" v={x.notify_email ? "On" : "Off"} /><KV k="Payment SMS" v={x.notify_sms ? "On" : "Off"} />
            <KV k="Client portal" v={x.has_portal ? "Active" : "Not invited"} />
          </Card>
          {x.notes ? <Card><T v="label" muted>Notes</T><T>{x.notes}</T></Card> : null}
          {msg && <Alert kind={msg.ok ? "ok" : "bad"} text={msg.text} />}
          {can("clients", true) && x.email && !x.has_portal && <Button title="Invite to client portal" icon="key-outline" kind="soft" loading={busy} onPress={invite} />}
          {can("clients", true) && x.has_portal && (
            <Button title="Turn off portal access" kind="danger" small onPress={() => RNAlert.alert("Turn off portal?", `${x.name} will no longer be able to log in.`, [
              { text: "Cancel", style: "cancel" },
              { text: "Turn off", style: "destructive", onPress: async () => { try { await api(`staff/clients/${id}/revoke_portal`, { body: {} }); c.refresh(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } } },
            ])} />
          )}
          {can("documents") && (
            <Section title="Proposals & invoices" action={can("documents", true) ? <Button small kind="soft" icon="add" title="New" onPress={() => router.push({ pathname: "/staff/document/edit", params: { client: id, type: "invoice" } })} /> : undefined}>
              {docs.data?.length ? <ListCard>{docs.data.map((d) => <DocRow key={d.id} d={d} />)}</ListCard> : <Empty title="Nothing yet" text="Proposals and invoices for this client show here." />}
            </Section>
          )}
          <View style={{ height: space.md }} />
        </>
      )}
    </Screen>
  );
}
