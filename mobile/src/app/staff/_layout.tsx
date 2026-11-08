import { Redirect, Stack } from "expo-router";
import { Loading, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function StaffLayout() {
  const t = useTheme();
  const { status, user } = useAuth();
  if (status === "loading") return <Screen><Loading /></Screen>;
  if (status !== "in" || !user) return <Redirect href="/login" />;
  if (user.is_client) return <Redirect href="/portal" />;
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
      headerTitleStyle: { fontWeight: "700" }, contentStyle: { backgroundColor: t.bg }, headerBackButtonDisplayMode: "minimal",
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="client/[id]" options={{ title: "Client" }} />
      <Stack.Screen name="client/edit" options={{ title: "Client", presentation: "modal" }} />
      <Stack.Screen name="document/[id]" options={{ title: "" }} />
      <Stack.Screen name="document/edit" options={{ title: "", presentation: "modal" }} />
      <Stack.Screen name="project/[id]" options={{ title: "Project" }} />
      <Stack.Screen name="certificates" options={{ title: "Certificates" }} />
      <Stack.Screen name="certificate/new" options={{ title: "New certificate", presentation: "modal" }} />
      <Stack.Screen name="certificate/[id]" options={{ title: "Certificate" }} />
      <Stack.Screen name="inbox" options={{ title: "Inbox" }} />
    </Stack>
  );
}
