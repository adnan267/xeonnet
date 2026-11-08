import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert as RNAlert } from "react-native";
import { Alert, Button, Card, Field, Loading, Screen, Segmented, Toggle } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { space } from "@/lib/theme";
import type { ClientT } from "@/lib/types";

const COUNTRIES = [{ value: "PK", label: "Pakistan" }, { value: "GB", label: "UK" }, { value: "AE", label: "UAE" }, { value: "SA", label: "Saudi" }, { value: "US", label: "USA" }];
const EMPTY = { name: "", company: "", email: "", phone: "", country: "PK", address: "", notes: "", notify_email: true, notify_sms: true };

export default function ClientEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { can } = useAuth();
  const [f, setF] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    api<ClientT>(`staff/clients/${id}`).then((c) => setF({ ...EMPTY, ...c, country: c.country || "PK" })).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [id]);
  const set = <K extends keyof typeof EMPTY>(k: K) => (v: (typeof EMPTY)[K]) => setF({ ...f, [k]: v });

  async function save() {
    setBusy(true); setErr(""); setErrors({});
    try {
      const c = await api<ClientT>(id ? `staff/clients/${id}` : "staff/clients", { method: id ? "PATCH" : "POST", body: f });
      if (id) router.back(); else router.replace(`/staff/client/${c.id}`);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length && !e.fields.detail) setErrors(e.fields); else setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  if (loading) return <Screen><Loading /></Screen>;
  return (
    <Screen footer={<Button title={id ? "Save changes" : "Add client"} icon="checkmark" loading={busy} onPress={save} />}>
      <Stack.Screen options={{ title: id ? "Edit client" : "New client" }} />
      {err ? <Alert text={err} /> : null}
      <Card style={{ gap: space.md }}>
        <Field label="Name *" value={f.name} onChangeText={set("name")} error={errors.name} />
        <Field label="Company" value={f.company} onChangeText={set("company")} />
        <Field label="Email" value={f.email} onChangeText={set("email")} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone / WhatsApp" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" hint="Used for payment SMS, e.g. 0300 1234567" />
        <Segmented value={f.country} onChange={set("country")} options={COUNTRIES} />
        <Field label="Address" value={f.address} onChangeText={set("address")} multiline />
        <Field label="Notes (staff only)" value={f.notes} onChangeText={set("notes")} multiline />
      </Card>
      <Card>
        <Toggle title="Payment emails" sub="Invoices, receipts and reminders by email" value={f.notify_email} onChange={set("notify_email")} />
        <Toggle title="Payment SMS" sub="Short SMS for invoices and payments" value={f.notify_sms} onChange={set("notify_sms")} />
      </Card>
      {id && can("clients", true) && (
        <Button title="Delete client" kind="danger" small onPress={() => RNAlert.alert("Delete client?", "This cannot be undone. Clients with invoices cannot be deleted.", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: async () => { try { await api(`staff/clients/${id}`, { method: "DELETE" }); if (router.canDismiss()) router.dismissAll(); router.replace("/staff/clients"); } catch (e) { setErr((e as Error).message); } } },
        ])} />
      )}
    </Screen>
  );
}
