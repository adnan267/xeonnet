import * as Application from "expo-application";
import { router } from "expo-router";
import { useState } from "react";
import { Alert as RNAlert, Linking, Platform, View } from "react-native";
import { Initials } from "@/components/bits";
import { Alert, Button, Card, Field, ListCard, ListItem, Row, Screen, Section, Segmented, T, Toggle } from "@/components/ui";
import { API_URL, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { registerForPush, unregisterPush } from "@/lib/push";
import { space, useThemeChoice, type ThemeChoice } from "@/lib/theme";

export default function Account() {
  const { user, logout, lockEnabled, setLockEnabled, biometricLabel, refreshUser } = useAuth();
  const { choice, setChoice } = useThemeChoice();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pw, setPw] = useState({ current: "", new: "" });
  const [busy, setBusy] = useState("");
  const [profile, setProfile] = useState({ first_name: user?.first_name ?? "", last_name: user?.last_name ?? "", phone: user?.phone ?? "" });
  const [profileFor, setProfileFor] = useState(user?.id);
  if (user && user.id !== profileFor) { setProfileFor(user.id); setProfile({ first_name: user.first_name, last_name: user.last_name, phone: user.phone }); }

  if (!user) {
    return <Screen><T>You are not signed in.</T><Button title="Sign in" onPress={() => router.replace("/login")} /></Screen>;
  }
  async function run(k: string, fn: () => Promise<void>) {
    setBusy(k); setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(""); }
  }

  return (
    <Screen>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Initials name={user.name} />
        <View style={{ flex: 1 }}><T v="h3">{user.name}</T><T v="small" muted>{user.email}</T>
          <T v="tiny" brand>{user.is_client ? `Client${user.client?.company ? ` · ${user.client.company}` : ""}` : user.job_title || user.role}</T></View>
      </Card>
      {msg && <Alert kind={msg.ok ? "ok" : "bad"} text={msg.text} />}

      <Section title="Security">
        <Card>
          {biometricLabel ? (
            <Toggle title={`Lock with ${biometricLabel}`} sub="Ask when the app opens or after a minute away" value={lockEnabled}
              onChange={(on) => run("lock", async () => { const ok = await setLockEnabled(on); if (!ok) setMsg({ ok: false, text: "Not changed: it was not confirmed." }); })} />
          ) : <T v="small" muted>{Platform.OS === "web" ? "App lock works in the phone app." : "Set up a fingerprint or face unlock on your phone to lock the app with it."}</T>}
        </Card>
      </Section>

      <Section title="Notifications">
        <Card style={{ gap: space.sm }}>
          <T v="small" muted>{user.is_client ? "Get a phone notification for new invoices, payments received and project updates." : "Get a phone notification for new website messages, tasks given to you and accepted proposals."}</T>
          <Row>
            <Button small kind="soft" icon="notifications-outline" title="Turn on" loading={busy === "push"} style={{ flex: 1 }}
              onPress={() => run("push", async () => { const r = await registerForPush(); setMsg(r.ok ? { ok: true, text: "Notifications are on for this phone." } : { ok: false, text: r.reason }); })} />
            <Button small kind="ghost" title="Turn off" style={{ flex: 1 }} onPress={() => run("push", async () => { await unregisterPush(); setMsg({ ok: true, text: "This phone will no longer get notifications." }); })} />
          </Row>
        </Card>
      </Section>

      <Section title="Appearance">
        <Segmented<ThemeChoice> value={choice} onChange={setChoice} options={[{ value: "system", label: "Phone setting" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
      </Section>

      <Section title="Your details">
        <Card style={{ gap: space.md }}>
          <Field label="First name" value={profile.first_name} onChangeText={(v) => setProfile({ ...profile, first_name: v })} />
          <Field label="Last name" value={profile.last_name} onChangeText={(v) => setProfile({ ...profile, last_name: v })} />
          <Field label="Phone" value={profile.phone} onChangeText={(v) => setProfile({ ...profile, phone: v })} keyboardType="phone-pad" />
          <Button small kind="soft" title="Save details" loading={busy === "profile"} onPress={() => run("profile", async () => { await api("auth/me", { method: "PATCH", body: profile }); await refreshUser(); setMsg({ ok: true, text: "Saved." }); })} />
        </Card>
      </Section>

      <Section title="Change password">
        <Card style={{ gap: space.md }}>
          <Field label="Current password" value={pw.current} onChangeText={(v) => setPw({ ...pw, current: v })} secureTextEntry />
          <Field label="New password (8+ characters)" value={pw.new} onChangeText={(v) => setPw({ ...pw, new: v })} secureTextEntry />
          <Button small kind="soft" title="Change password" loading={busy === "pw"} disabled={!pw.current || pw.new.length < 8}
            onPress={() => run("pw", async () => { await api("auth/password/change", { body: pw }); setPw({ current: "", new: "" }); setMsg({ ok: true, text: "Password changed." }); })} />
        </Card>
      </Section>

      <ListCard>
        <ListItem icon="globe-outline" title="Open xeonnet.site" onPress={() => Linking.openURL(API_URL)} />
        <ListItem icon="call-outline" title="Contact Xeon Net" onPress={() => router.push("/contact")} />
      </ListCard>

      <Button title="Sign out" kind="danger" icon="log-out-outline" onPress={() => RNAlert.alert("Sign out?", "You will need your password to sign in again.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: async () => { await logout(); if (router.canDismiss()) router.dismissAll(); router.replace("/"); } },
      ])} />
      <T v="tiny" faint center>Xeon Net app {Application.nativeApplicationVersion ?? "1.0.0"}</T>
    </Screen>
  );
}
