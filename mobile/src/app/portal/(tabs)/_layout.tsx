import { Tabs } from "expo-router/tabs";
import { tabIcon, tabOptions } from "@/components/tabs";
import { useTheme } from "@/lib/theme";

export default function PortalTabs() {
  const t = useTheme();
  return (
    <Tabs screenOptions={tabOptions(t)}>
      <Tabs.Screen name="index" options={{ title: "Overview", tabBarIcon: tabIcon("home", "home-outline") }} />
      <Tabs.Screen name="documents" options={{ title: "Invoices", tabBarIcon: tabIcon("receipt", "receipt-outline") }} />
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: tabIcon("briefcase", "briefcase-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tabIcon("menu", "menu-outline") }} />
    </Tabs>
  );
}
