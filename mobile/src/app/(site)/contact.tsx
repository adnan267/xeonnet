import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";
import { Action, Alert, Button, Card, Field, Row, Screen, Segmented, T } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { company, services } from "@/lib/content";
import { space } from "@/lib/theme";

const BUDGETS = ["Not sure", "Under 50k", "50k–150k", "150k–500k", "500k+"];

export default function Contact() {
  const params = useLocalSearchParams<{ service?: string }>();
  const [f, setF] = useState({ name: "", email: "", phone: "", service: "", budget: "Not sure", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");
  // a "Get a quote for this" button passes the service name
  const [seenService, setSeenService] = useState<string | undefined>(undefined);
  if (params.service && params.service !== seenService) { setSeenService(params.service); setF((x) => ({ ...x, service: params.service! })); }
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  async function send() {
    setBusy(true); setErr(""); setErrors({});
    try {
      const r = await api<{ message: string }>("public/contact", { body: f, auth: false });
      setDone(r.message); setF({ name: "", email: "", phone: "", service: "", budget: "Not sure", message: "" });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length) setErrors(e.fields);
      else setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T v="h1">Let’s talk</T>
        <T muted>Tell us what you need. We reply within one working day with a clear quote.</T>
      </View>
      <Card>
        <Row style={{ justifyContent: "space-around" }}>
          <Action icon="call-outline" title="Call" onPress={() => Linking.openURL(`tel:${company.phone_raw}`)} />
          <Action icon="logo-whatsapp" title="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${company.whatsapp}`)} />
          <Action icon="mail-outline" title="Email" onPress={() => Linking.openURL(`mailto:${company.email}`)} />
          <Action icon="location-outline" title="Visit" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(company.address)}`)} />
        </Row>
        <T v="small" muted center style={{ marginTop: space.sm }}>{company.address} · {company.hours}</T>
      </Card>
      {done ? <Alert kind="ok" text={done} /> : null}
      <Card style={{ gap: space.md }}>
        <T v="h3">Request a quote</T>
        <Field label="Your name *" value={f.name} onChangeText={set("name")} error={errors.name} autoComplete="name" />
        <Field label="Email *" value={f.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Phone / WhatsApp" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" />
        <View style={{ gap: 6 }}>
          <T v="label" muted>Service</T>
          <Segmented value={f.service} onChange={set("service")} options={[{ value: "", label: "Not sure" }, ...services.map((s) => ({ value: s.title, label: s.title }))]} />
        </View>
        <View style={{ gap: 6 }}>
          <T v="label" muted>Budget (PKR)</T>
          <Segmented value={f.budget} onChange={set("budget")} options={BUDGETS.map((b) => ({ value: b, label: b }))} />
        </View>
        <Field label="Your message *" value={f.message} onChangeText={set("message")} error={errors.message} multiline placeholder="What would you like us to build or fix?" />
        {err ? <Alert text={err} /> : null}
        <Button title="Send request" icon="send" loading={busy} onPress={send} />
      </Card>
    </Screen>
  );
}
