import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Alert, BottomSheet, Button, Card, DateField, Divider, Field, IconButton, KV, ListItem, Loading, Row, Screen, Section, Segmented, T } from "@/components/ui";
import { api } from "@/lib/api";
import { addDays, money, today } from "@/lib/format";
import { space, useTheme } from "@/lib/theme";
import type { ClientT, Doc, Item } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

const CURRENCIES = ["PKR", "GBP", "USD", "EUR", "AED", "SAR"];
type Defaults = { proposal_terms: string; invoice_terms: string; next_invoice: string; next_proposal: string };
const INTRO = "Thank you for the opportunity to work with you. This proposal outlines the scope, timeline and investment for your project.";

export default function DocumentEdit() {
  const t = useTheme();
  const p = useLocalSearchParams<{ id?: string; type?: "invoice" | "proposal"; client?: string }>();
  const clients = useQuery<ClientT[]>("staff/clients");
  const defs = useQuery<Defaults>("staff/documents/defaults");
  const [type, setType] = useState<"invoice" | "proposal">(p.type === "proposal" ? "proposal" : "invoice");
  const [loading, setLoading] = useState(!!p.id);
  const [f, setF] = useState({
    client: p.client ?? "", title: "", issue_date: today(), due_date: addDays(today(), type === "invoice" ? 14 : 30), currency: "PKR",
    discount_type: "amount", discount_value: "0", tax_percent: "0", intro: type === "proposal" ? INTRO : "", scope: "", timeline: "", terms: "", notes: "",
  });
  const [items, setItems] = useState<Item[]>([{ description: "", qty: "1", unit_price: "" }]);
  const [pick, setPick] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!p.id) return;
    api<Doc>(`staff/documents/${p.id}`).then((d) => {
      setType(d.doc_type);
      setF({ client: String(d.client ?? d.client_detail.id), title: d.title, issue_date: d.issue_date, due_date: d.due_date ?? "", currency: d.currency,
        discount_type: d.discount_type, discount_value: String(Number(d.discount_value)), tax_percent: String(Number(d.tax_percent)),
        intro: d.intro, scope: d.scope, timeline: d.timeline, terms: d.terms, notes: d.notes });
      setItems(d.items.map((i) => ({ description: i.description, qty: String(Number(i.qty)), unit_price: String(Number(i.unit_price)) })));
    }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [p.id]);
  // fill the default terms once they arrive (and again after switching invoice ↔ proposal)
  const [termsFor, setTermsFor] = useState("");
  if (!p.id && defs.data && !f.terms && termsFor !== type) {
    setTermsFor(type);
    setF((x) => ({ ...x, terms: type === "invoice" ? defs.data!.invoice_terms : defs.data!.proposal_terms }));
  }

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const num = (v: string) => v.replace(/[^\d.]/g, "");
  const setItem = (i: number, k: keyof Item, v: string) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const tot = useMemo(() => {
    const sub = items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.unit_price) || 0), 0);
    const dv = Number(f.discount_value) || 0;
    const disc = f.discount_type === "percent" ? sub * Math.min(dv, 100) / 100 : Math.min(dv, sub);
    const tax = (sub - disc) * (Number(f.tax_percent) || 0) / 100;
    return { sub, disc, tax, total: sub - disc + tax };
  }, [items, f]);
  const client = clients.data?.find((c) => String(c.id) === f.client);

  async function save() {
    if (!f.client) { setErr("Choose a client."); return; }
    if (!items.some((i) => i.description.trim())) { setErr("Add at least one item."); return; }
    setBusy(true); setErr("");
    try {
      const body = { ...f, doc_type: type, client: Number(f.client), due_date: f.due_date || null,
        items: items.filter((i) => i.description.trim()).map((i) => ({ description: i.description.trim(), qty: i.qty || "1", unit_price: i.unit_price || "0" })) };
      const d = await api<Doc>(p.id ? `staff/documents/${p.id}` : "staff/documents", { method: p.id ? "PUT" : "POST", body });
      if (p.id) router.back(); else router.replace(`/staff/document/${d.id}`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  if (loading) return <Screen><Loading /></Screen>;
  const s = search.trim().toLowerCase();
  return (
    <Screen footer={<Row><View style={{ flex: 1 }}><T v="small" muted>Total</T><T v="h2" brand>{money(tot.total, f.currency)}</T></View><Button title={p.id ? "Save" : `Create ${type}`} icon="checkmark" loading={busy} onPress={save} style={{ flex: 1.3 }} /></Row>}>
      <Stack.Screen options={{ title: p.id ? "Edit" : type === "invoice" ? "New invoice" : "New proposal" }} />
      {!p.id && <Segmented value={type} onChange={(v) => { setType(v); setF((x) => ({ ...x, terms: "", intro: v === "proposal" ? INTRO : "", due_date: addDays(x.issue_date, v === "invoice" ? 14 : 30) })); }}
        options={[{ value: "invoice", label: "Invoice" }, { value: "proposal", label: "Proposal" }]} />}
      {!p.id && defs.data && <T v="small" muted>This {type} will be numbered <T v="small" style={{ fontWeight: "700" }}>{type === "invoice" ? defs.data.next_invoice : defs.data.next_proposal}</T>.</T>}
      {err ? <Alert text={err} /> : null}
      <Card style={{ gap: space.md }}>
        <View style={{ gap: 6 }}>
          <T v="label" muted>Client *</T>
          <Button kind="ghost" title={client ? `${client.name}${client.company ? ` · ${client.company}` : ""}` : "Choose a client"} icon="person-outline" onPress={() => setPick(true)} />
        </View>
        <Field label="Title / project" value={f.title} onChangeText={set("title")} placeholder="e.g. Social media management" />
        <DateField label="Issue date" value={f.issue_date} onChange={set("issue_date")} />
        <DateField label={type === "proposal" ? "Valid until" : "Due date"} value={f.due_date} onChange={set("due_date")} optional />
        <View style={{ gap: 6 }}><T v="label" muted>Currency</T><Segmented value={f.currency} onChange={set("currency")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></View>
      </Card>

      <Section title="Items" action={<Button small kind="soft" icon="add" title="Add item" onPress={() => setItems([...items, { description: "", qty: "1", unit_price: "" }])} />}>
        {items.map((it, i) => (
          <Card key={i} style={{ gap: space.sm }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="label" muted>Item {i + 1}</T>
              {items.length > 1 && <IconButton name="trash-outline" label="Remove item" onPress={() => setItems(items.filter((_, j) => j !== i))} />}
            </Row>
            <Field label="Description" value={it.description} onChangeText={(v) => setItem(i, "description", v)} multiline style={{ minHeight: 0 }} />
            <Row>
              <Field label="Qty" value={it.qty} onChangeText={(v) => setItem(i, "qty", num(v))} keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Field label={`Unit price (${f.currency})`} value={it.unit_price} onChangeText={(v) => setItem(i, "unit_price", num(v))} keyboardType="decimal-pad" style={{ flex: 2 }} />
            </Row>
            <T v="small" muted style={{ textAlign: "right" }}>{money((Number(it.qty) || 0) * (Number(it.unit_price) || 0), f.currency)}</T>
          </Card>
        ))}
      </Section>

      <Card style={{ gap: space.md }}>
        <View style={{ gap: 6 }}><T v="label" muted>Discount</T><Segmented value={f.discount_type} onChange={set("discount_type")} options={[{ value: "amount", label: `Amount (${f.currency})` }, { value: "percent", label: "Percent %" }]} /></View>
        <Row>
          <Field label="Discount" value={f.discount_value} onChangeText={(v) => set("discount_value")(num(v))} keyboardType="decimal-pad" style={{ flex: 1 }} />
          <Field label="Tax %" value={f.tax_percent} onChangeText={(v) => set("tax_percent")(num(v))} keyboardType="decimal-pad" style={{ flex: 1 }} />
        </Row>
        <Divider />
        <KV k="Subtotal" v={money(tot.sub, f.currency)} />
        {tot.disc > 0 && <KV k="Discount" v={`− ${money(tot.disc, f.currency)}`} />}
        {tot.tax > 0 && <KV k="Tax" v={money(tot.tax, f.currency)} />}
        <KV k="Total" v={money(tot.total, f.currency)} strong />
      </Card>

      <Card style={{ gap: space.md }}>
        {type === "proposal" && <Field label="Introduction" value={f.intro} onChangeText={set("intro")} multiline />}
        <Field label="Scope of work (one point per line)" value={f.scope} onChangeText={set("scope")} multiline />
        <Field label="Timeline (one step per line)" value={f.timeline} onChangeText={set("timeline")} multiline />
        <Field label="Terms & conditions (one per line)" value={f.terms} onChangeText={set("terms")} multiline />
        <Field label="Notes" value={f.notes} onChangeText={set("notes")} multiline />
      </Card>

      <BottomSheet visible={pick} onClose={() => setPick(false)} title="Choose client">
        <Field label="Search" value={search} onChangeText={setSearch} placeholder="Name or company" />
        <Button kind="soft" small icon="person-add-outline" title="Add a new client" onPress={() => { setPick(false); router.push("/staff/client/edit"); }} />
        <Card style={{ paddingVertical: 4, gap: 0 }}>
          {(clients.data ?? []).filter((c) => !s || `${c.name} ${c.company}`.toLowerCase().includes(s)).map((c, i) => (
            <View key={c.id}>{i > 0 && <Divider />}<ListItem title={c.name} sub={c.company || c.email} onPress={() => { set("client")(String(c.id)); setPick(false); }}
              right={String(c.id) === f.client ? <T brand>✓</T> : undefined} /></View>
          ))}
        </Card>
        {clients.loading && <Loading />}
      </BottomSheet>
      <View style={{ height: 1, backgroundColor: t.bg }} />
    </Screen>
  );
}
