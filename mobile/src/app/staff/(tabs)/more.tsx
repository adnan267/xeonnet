import { router } from "expo-router";
import { Linking } from "react-native";
import { Initials } from "@/components/bits";
import { Card, ListCard, ListItem, Screen, Section, T } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function More() {
  const { user, can } = useAuth();
  return (
    <Screen>
      <Card onPress={() => router.push("/account")} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Initials name={user?.name ?? ""} />
        <T v="h3" style={{ flex: 1 }}>{user?.name}{"\n"}<T v="small" muted>{user?.job_title || user?.role} · {user?.email}</T></T>
      </Card>
      <Section title="Work">
        <ListCard>
          {can("certificates") && <ListItem icon="ribbon-outline" title="Certificates" sub="Issue, share PDF, verify, revoke" onPress={() => router.push("/staff/certificates")} />}
          {can("certificates") && <ListItem icon="qr-code-outline" title="Scan a certificate" sub="Check a QR code with the camera" onPress={() => router.push("/scan")} />}
          {can("inbox") && <ListItem icon="mail-unread-outline" title="Inbox" sub="Messages and quote requests from the website" onPress={() => router.push("/staff/inbox")} />}
          {can("documents") && <ListItem icon="receipt-outline" title="Proposals & invoices" onPress={() => router.push("/staff/documents")} />}
          {can("clients") && <ListItem icon="people-outline" title="Clients" onPress={() => router.push("/staff/clients")} />}
        </ListCard>
      </Section>
      <Section title="Xeon Net">
        <ListCard>
          <ListItem icon="globe-outline" title="Website" sub="Home, services and portfolio" onPress={() => router.push("/")} />
          <ListItem icon="shield-checkmark-outline" title="Verify a certificate" onPress={() => router.push("/verify")} />
          <ListItem icon="desktop-outline" title="Open full staff panel" sub="Settings, team and everything else in the browser" onPress={() => Linking.openURL(`${API_URL}/staff`)} />
        </ListCard>
      </Section>
      <Section title="You">
        <ListCard>
          <ListItem icon="person-circle-outline" title="Account & security" sub="App lock, notifications, theme, sign out" onPress={() => router.push("/account")} />
        </ListCard>
      </Section>
    </Screen>
  );
}
