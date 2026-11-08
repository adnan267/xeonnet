import { router } from "expo-router";
import { Linking } from "react-native";
import { ListCard, ListItem, Screen, Section } from "@/components/ui";
import { company } from "@/lib/content";

export default function PortalMore() {
  return (
    <Screen>
      <Section title="Account">
        <ListCard>
          <ListItem icon="person-circle-outline" title="Account & security" sub="App lock, notifications, password, sign out" onPress={() => router.push("/account")} />
        </ListCard>
      </Section>
      <Section title="Xeon Net">
        <ListCard>
          <ListItem icon="layers-outline" title="Our services" onPress={() => router.push("/services")} />
          <ListItem icon="chatbubbles-outline" title="Request new work" onPress={() => router.push("/contact")} />
          <ListItem icon="shield-checkmark-outline" title="Verify a certificate" onPress={() => router.push("/verify")} />
          <ListItem icon="logo-whatsapp" title="WhatsApp us" sub={company.phone} onPress={() => Linking.openURL(`https://wa.me/${company.whatsapp}`)} />
          <ListItem icon="mail-outline" title="Email us" sub={company.email} onPress={() => Linking.openURL(`mailto:${company.email}`)} />
        </ListCard>
      </Section>
    </Screen>
  );
}
