import { useState } from "react";
import { Alert, Button, Field, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Screen>
      <T muted>Enter your email. If it belongs to a Xeon Net account we will email you a link to choose a new password.</T>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      {done ? <Alert kind="ok" text="If that email is registered, a reset link is on its way. Check your inbox." /> : null}
      {err ? <Alert text={err} /> : null}
      <Button title="Send reset link" loading={busy} disabled={!email} onPress={async () => {
        setBusy(true); setErr("");
        try { await api("auth/password/forgot", { body: { email }, auth: false }); setDone(true); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
      }} />
    </Screen>
  );
}
