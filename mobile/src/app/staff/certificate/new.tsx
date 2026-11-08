import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import CertPreview from "@/components/CertPreview";
import { Alert, Button, Card, DateField, Field, Loading, Row, Screen, Section, T } from "@/components/ui";
import { api } from "@/lib/api";
import { workOutDuration } from "@/lib/format";
import { certificateHtml } from "@/lib/pdf";
import { space } from "@/lib/theme";
import type { Cert } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

type Blank = { next_code: string; issued_on: string; ceo_signature: string; hr_signature: string };

/** Same as the website: type name, focus and dates. Number, issue date and QR are automatic. */
export default function NewCertificate() {
  const blank = useQuery<Blank>("staff/certificates/blank");
  const [f, setF] = useState({ name: "", field: "", start: "", end: "", duration: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const auto = workOutDuration(f.start, f.end);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  async function issue() {
    if (!f.name.trim() || !f.field.trim() || !f.start || !f.end) { setErr("Fill in the name, focus and both dates."); return; }
    if (f.end < f.start) { setErr("End date is before the start date."); return; }
    setBusy(true); setErr("");
    try {
      const c = await api<Cert>("staff/certificates", { body: {
        holder_name: f.name.trim(), doc_type: "Internship Completion Certificate", title: f.field.trim(),
        duration: f.duration.trim() || auto, start_date: f.start, end_date: f.end } });
      router.replace({ pathname: "/staff/certificate/[id]", params: { id: String(c.id), fresh: "1" } });
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  if (blank.loading && !blank.data) return <Screen><Loading /></Screen>;
  const b = blank.data;
  const preview: Cert = { code: b?.next_code ?? "", issued_on: b?.issued_on ?? "", holder_name: f.name, doc_type: "Internship Completion Certificate",
    title: f.field, duration: f.duration || auto, start_date: f.start || null, end_date: f.end || null, period: "" };
  return (
    <Screen footer={<Button title="Issue certificate" icon="ribbon-outline" loading={busy} onPress={issue} />}>
      {blank.error ? <Alert text={blank.error} onRetry={blank.refresh} /> : null}
      <Card style={{ gap: space.md }}>
        <Field label="Intern name *" value={f.name} onChangeText={set("name")} placeholder="Full name as it should be printed" autoCapitalize="words" />
        <Field label="Focus (internship field) *" value={f.field} onChangeText={set("field")} placeholder="Full Stack Web Development" />
        <Row style={{ alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}><DateField label="Start date *" value={f.start} onChange={set("start")} /></View>
          <View style={{ flex: 1 }}><DateField label="End date *" value={f.end} onChange={set("end")} /></View>
        </Row>
        <Field label="Duration" value={f.duration} onChangeText={set("duration")} placeholder={auto || "3 Months"} hint={auto ? `Leave empty to use “${auto}”` : "Worked out from the dates if left empty"} />
      </Card>
      {b && <Alert kind="info" text={`Filled in automatically: number ${b.next_code}, issue date today, and a QR code that opens xeonnet.site/verify.`} />}
      {err ? <Alert text={err} /> : null}
      <Section title="Preview">
        <CertPreview html={certificateHtml(preview, { ceo: b?.ceo_signature, hr: b?.hr_signature }, { preview: true })} />
        <T v="tiny" faint>The number is confirmed when you issue it. The QR code is added on the issued certificate.</T>
      </Section>
    </Screen>
  );
}
