import { useState } from "react";
import { Linking, View } from "react-native";
import { Action, Badge, Card, Empty, QueryState, Row, Screen, Segmented, T } from "@/components/ui";
import { api } from "@/lib/api";
import { ago } from "@/lib/format";
import { space, useTheme } from "@/lib/theme";
import type { MessageT } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

const wa = (p: string) => { let d = p.replace(/\D/g, ""); if (d.startsWith("0")) d = "92" + d.slice(1); return d; };

export default function Inbox() {
  const t = useTheme();
  const [filter, setFilter] = useState<"unread" | "all">("unread");
  const q = useQuery<MessageT[]>("staff/messages");
  const [open, setOpen] = useState<number | null>(null);
  const list = (q.data ?? []).filter((m) => filter === "all" || !m.is_read);

  async function read(m: MessageT, is_read = true) {
    if (!q.data || m.is_read === is_read) return;
    q.setData(q.data.map((x) => (x.id === m.id ? { ...x, is_read } : x)));
    try { await api(`staff/messages/${m.id}`, { method: "PATCH", body: { is_read } }); } catch { q.refresh(); }
  }

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <Segmented value={filter} onChange={setFilter} options={[{ value: "unread", label: `Unread (${(q.data ?? []).filter((m) => !m.is_read).length})` }, { value: "all", label: "All" }]} />
      <QueryState q={q} />
      {q.data && !list.length && <Empty icon="mail-open-outline" title={filter === "unread" ? "All caught up" : "No messages yet"} text="Messages from the website contact form arrive here." />}
      {list.map((m) => (
        <Card key={m.id} onPress={() => { setOpen(open === m.id ? null : m.id); read(m); }} style={!m.is_read ? { borderColor: t.brand, borderWidth: 1.5 } : undefined}>
          <Row style={{ justifyContent: "space-between" }}>
            <T v="h3" style={{ flex: 1 }} numberOfLines={1}>{m.name}</T>
            <T v="tiny" faint>{ago(m.created_at)}</T>
          </Row>
          <Row wrap>{m.service ? <Badge status="sent" text={m.service} /> : null}{m.budget ? <Badge status="draft" text={m.budget} /> : null}</Row>
          <T muted numberOfLines={open === m.id ? undefined : 2}>{m.message}</T>
          {open === m.id && (
            <View style={{ gap: space.md, marginTop: space.sm }}>
              <T v="small" faint selectable>{[m.email, m.phone].filter(Boolean).join(" · ")}</T>
              <Row style={{ justifyContent: "space-around" }}>
                <Action icon="mail-outline" title="Reply" onPress={() => Linking.openURL(`mailto:${m.email}?subject=${encodeURIComponent("Re: your enquiry to Xeon Net")}`)} />
                {m.phone ? <Action icon="logo-whatsapp" title="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${wa(m.phone)}`)} /> : null}
                {m.phone ? <Action icon="call-outline" title="Call" onPress={() => Linking.openURL(`tel:${m.phone.replace(/[^\d+]/g, "")}`)} /> : null}
                <Action icon="mail-unread-outline" title="Mark unread" onPress={() => read(m, false)} />
              </Row>
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}
