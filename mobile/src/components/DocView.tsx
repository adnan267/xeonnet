import { View } from "react-native";
import { company } from "@/lib/content";
import { fdate, money } from "@/lib/format";
import { space, useTheme } from "@/lib/theme";
import type { Doc } from "@/lib/types";
import { Badge, Card, Divider, KV, Row, Section, T } from "./ui";

const lines = (t: string) => (t || "").split("\n").map((x) => x.trim()).filter(Boolean);
const n = (v: string | number) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Proposal / invoice shown natively on the phone (the PDF uses the same content). */
export default function DocView({ d }: { d: Doc }) {
  const t = useTheme();
  const cur = d.currency, tt = d.totals;
  const bullets = (title: string, items: string[]) => items.length ? (
    <Section title={title}><Card style={{ gap: 6 }}>{items.map((l, i) => <Row key={i} style={{ alignItems: "flex-start" }}><T muted>•</T><T style={{ flex: 1 }}>{l}</T></Row>)}</Card></Section>
  ) : null;
  return (
    <View style={{ gap: space.lg }}>
      <Card style={{ borderTopWidth: 4, borderTopColor: t.brand, gap: space.sm }}>
        <Row style={{ justifyContent: "space-between" }}>
          <T v="eyebrow" brand>{d.doc_type}</T>
          <Badge status={d.display_status} />
        </Row>
        <T v="h1" selectable>{d.number}</T>
        {d.title ? <T v="h3">{d.title}</T> : null}
        <T v="display" style={{ color: t.brandText, fontSize: 30 }}>{money(d.doc_type === "invoice" && Number(tt.paid) > 0 ? tt.balance : tt.total, cur)}</T>
        <T v="small" muted>{d.doc_type === "invoice" && Number(tt.paid) > 0 ? `Balance due of ${money(tt.total, cur)}` : d.words}</T>
        <Divider />
        <KV k={d.doc_type === "proposal" ? "Prepared for" : "Bill to"} v={[d.client_detail.name, d.client_detail.company].filter(Boolean).join(" · ")} strong />
        <KV k="Issued" v={fdate(d.issue_date)} />
        <KV k={d.doc_type === "proposal" ? "Valid until" : "Due"} v={fdate(d.due_date)} />
        <KV k="Accepted" v={d.accepted_at ? fdate(d.accepted_at) : ""} />
      </Card>
      {d.intro ? <T muted>{d.intro}</T> : null}
      <Section title="Items">
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {d.items.map((i, k) => (
            <View key={k}>
              {k > 0 && <Divider />}
              <Row style={{ paddingVertical: 10, alignItems: "flex-start" }}>
                <View style={{ flex: 1, gap: 2 }}><T>{i.description}</T><T v="small" muted>{n(i.qty)} × {money(i.unit_price, cur)}</T></View>
                <T v="label">{money(Number(i.qty) * Number(i.unit_price), cur)}</T>
              </Row>
            </View>
          ))}
        </Card>
        <Card style={{ gap: 2 }}>
          <KV k="Subtotal" v={money(tt.subtotal, cur)} />
          {Number(tt.discount) > 0 && <KV k={`Discount${d.discount_type === "percent" ? ` (${n(d.discount_value)}%)` : ""}`} v={`− ${money(tt.discount, cur)}`} />}
          {Number(tt.tax) > 0 && <KV k={`Tax (${n(d.tax_percent)}%)`} v={money(tt.tax, cur)} />}
          <KV k="Total" v={money(tt.total, cur)} strong />
          {d.doc_type === "invoice" && Number(tt.paid) > 0 && <><KV k="Paid" v={`− ${money(tt.paid, cur)}`} /><KV k="Balance due" v={money(tt.balance, cur)} strong /></>}
        </Card>
      </Section>
      {d.doc_type === "invoice" && d.payments.length > 0 && (
        <Section title="Payments received">
          <Card style={{ gap: 2 }}>{d.payments.map((p) => <KV key={p.id} k={`${fdate(p.paid_on)}${p.method ? ` · ${p.method}` : ""}`} v={money(p.amount, cur)} />)}</Card>
        </Section>
      )}
      {d.doc_type === "invoice" && d.bank.length > 0 && (
        <Section title="Payment details"><Card style={{ gap: 2 }}>{d.bank.map((b) => <KV key={b.label} k={b.label} v={b.value} />)}</Card></Section>
      )}
      {bullets("Scope of work", lines(d.scope))}
      {bullets("Timeline", lines(d.timeline))}
      {bullets("Terms & conditions", lines(d.terms))}
      {d.notes ? <Section title="Notes"><Card><T>{d.notes}</T></Card></Section> : null}
      <T v="tiny" faint center>{company.name} · {company.phone} · {company.email}</T>
    </View>
  );
}
