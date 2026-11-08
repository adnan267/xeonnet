import { Redirect, Stack } from "expo-router";
import { Loading, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function PortalLayout() {
  const t = useTheme();
  const { status, user } = useAuth();
  if (status === "loading") return <Screen><Loading /></Screen>;
  if (status !== "in" || !user) return <Redirect href="/login" />;
  if (!user.is_client) return <Redirect href="/staff" />;
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
      headerTitleStyle: { fontWeight: "700" }, contentStyle: { backgroundColor: t.bg }, headerBackButtonDisplayMode: "minimal",
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="document/[id]" options={{ title: "" }} />
      <Stack.Screen name="project/[id]" options={{ title: "Project" }} />
    </Stack>
  );
}
