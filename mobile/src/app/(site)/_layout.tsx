import { router } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { Pressable, Text } from "react-native";
import { Mark } from "@/components/Logo";
import { tabIcon, tabOptions } from "@/components/tabs";
import { Row } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

function HeaderRight() {
  const t = useTheme();
  const { status, user } = useAuth();
  const signedIn = status === "in" && user;
  return (
    <Pressable onPress={() => router.push(signedIn ? (user.is_client ? "/portal" : "/staff") : "/login")} hitSlop={8}
      style={({ pressed }) => ({ marginRight: 16, backgroundColor: t.brand, paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
      <Text style={{ color: t.onBrand, fontWeight: "700", fontSize: 13.5 }}>{signedIn ? (user.is_client ? "My portal" : "Staff panel") : "Login"}</Text>
    </Pressable>
  );
}

function HeaderTitle({ title }: { title: string }) {
  const t = useTheme();
  return <Row gap={10}><Mark size={22} /><Text style={{ color: t.text, fontWeight: "800", fontSize: 19 }}>{title}</Text></Row>;
}

export default function SiteTabs() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{ ...tabOptions(t), headerRight: () => <HeaderRight />, headerTitle: () => <HeaderTitle title="Xeon Net" /> }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home", "home-outline") }} />
      <Tabs.Screen name="services" options={{ title: "Services", tabBarIcon: tabIcon("layers", "layers-outline") }} />
      <Tabs.Screen name="work" options={{ title: "Portfolio", tabBarIcon: tabIcon("briefcase", "briefcase-outline") }} />
      <Tabs.Screen name="verify" options={{ title: "Verify", tabBarIcon: tabIcon("shield-checkmark", "shield-checkmark-outline") }} />
      <Tabs.Screen name="contact" options={{ title: "Contact", tabBarIcon: tabIcon("chatbubbles", "chatbubbles-outline") }} />
    </Tabs>
  );
}
