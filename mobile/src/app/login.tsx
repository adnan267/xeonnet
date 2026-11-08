import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Logo } from "@/components/Logo";
import { Alert, Button, Field, Screen, T } from "@/components/ui";
import { useAuth, type User } from "@/lib/auth";
import { space } from "@/lib/theme";

function goHome(u: User) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(u.is_client ? "/portal" : "/staff");
}

export default function Login() {
  const { login, biometricLabel, setLockEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [askLock, setAskLock] = useState<User | null>(null);

  async function submit() {
    if (!email || !password) { setErr("Enter your email and password."); return; }
    setBusy(true); setErr("");
    try {
      const u = await login(email, password);
      if (biometricLabel) setAskLock(u);    // offer fingerprint / Face ID once
      else goHome(u);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  if (askLock) {
    return (
      <Screen style={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", gap: space.md }}>
          <Logo height={70} />
          <T v="h2" center>Use {biometricLabel} next time?</T>
          <T muted center>Keep your clients and invoices private. The app will ask for {biometricLabel} when you open it.</T>
        </View>
        <Button title={`Turn on ${biometricLabel}`} icon="finger-print" onPress={async () => { await setLockEnabled(true); goHome(askLock); }} />
        <Button title="Not now" kind="ghost" onPress={() => goHome(askLock)} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <View style={{ alignItems: "center", gap: space.sm, marginBottom: space.md }}>
          <Logo height={78} />
          <T v="h1" center>Sign in</T>
          <T muted center>Staff and clients of Xeon Net. Use the same email and password as the website.</T>
        </View>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="username" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!show} autoComplete="password" textContentType="password"
          returnKeyType="go" onSubmitEditing={submit} />
        <Button title={show ? "Hide password" : "Show password"} kind="ghost" small onPress={() => setShow(!show)} style={{ alignSelf: "flex-start" }} />
        {err ? <Alert text={err} /> : null}
        <Button title="Sign in" icon="log-in-outline" loading={busy} onPress={submit} />
        <Button title="Forgot password?" kind="ghost" onPress={() => router.push("/forgot")} />
        <T v="small" faint center>Clients get their login from Xeon Net by email.</T>
      </Screen>
    </KeyboardAvoidingView>
  );
}
