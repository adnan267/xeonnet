import { router } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { View } from "react-native";
import { tabIcon, tabOptions } from "@/components/tabs";
import { IconButton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function StaffTabs() {
  const t = useTheme();
  const { can } = useAuth();
  return (
    <Tabs screenOptions={{
      ...tabOptions(t),
      headerRight: () => <View style={{ marginRight: 16 }}><IconButton name="qr-code-outline" label="Scan certificate" onPress={() => router.push("/scan")} /></View>,
    }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: tabIcon("grid", "grid-outline") }} />
      <Tabs.Screen name="clients" options={{ title: "Clients", href: can("clients") ? undefined : null, tabBarIcon: tabIcon("people", "people-outline") }} />
      <Tabs.Screen name="documents" options={{ title: "Billing", href: can("documents") ? undefined : null, tabBarIcon: tabIcon("receipt", "receipt-outline") }} />
      <Tabs.Screen name="work" options={{ title: "Projects", href: can("projects") || can("tasks") ? undefined : null, tabBarIcon: tabIcon("briefcase", "briefcase-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tabIcon("menu", "menu-outline") }} />
    </Tabs>
  );
}
