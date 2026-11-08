import * as Notifications from "expo-notifications";
import { Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LockScreen from "@/components/LockScreen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { openFromNotification, registerForPush } from "@/lib/push";
import { ThemeProvider, useTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const t = useTheme();
  const { status, user, locked } = useAuth();
  const registered = useRef(false);
  const handled = useRef<string | null>(null);

  useEffect(() => { if (status !== "loading") SplashScreen.hideAsync().catch(() => {}); }, [status]);

  // opening the app while signed in: start in the staff panel / client portal
  // (unless the app was opened on a specific page, e.g. a verify link)
  const pathname = usePathname();
  const started = useRef(false);
  useEffect(() => {
    if (status === "loading" || started.current) return;
    started.current = true;
    if (status === "in" && user && pathname === "/") router.replace(user.is_client ? "/portal" : "/staff");
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // phone notifications: register once per sign-in, open the right screen when one is tapped
  useEffect(() => {
    if (status !== "in" || !user || Platform.OS === "web") { registered.current = false; return; }
    if (!registered.current) { registered.current = true; registerForPush().catch(() => {}); }
    const open = (r: Notifications.NotificationResponse | null) => {
      if (!r || handled.current === r.notification.request.identifier) return;
      handled.current = r.notification.request.identifier;
      openFromNotification(r.notification.request.content.data as Record<string, unknown>, user);
    };
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    return () => sub.remove();
  }, [status, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StatusBar style={t.mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" }, contentStyle: { backgroundColor: t.bg }, headerBackButtonDisplayMode: "minimal",
      }}>
        <Stack.Screen name="(site)" options={{ headerShown: false }} />
        <Stack.Screen name="staff" options={{ headerShown: false }} />
        <Stack.Screen name="portal" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "", presentation: "modal" }} />
        <Stack.Screen name="forgot" options={{ title: "Reset password", presentation: "modal" }} />
        <Stack.Screen name="scan" options={{ title: "Scan certificate QR", presentation: "fullScreenModal", headerShown: false }} />
        <Stack.Screen name="verify/[code]" options={{ title: "Verification" }} />
        <Stack.Screen name="service/[slug]" options={{ title: "" }} />
        <Stack.Screen name="work/[slug]" options={{ title: "" }} />
        <Stack.Screen name="account" options={{ title: "Account" }} />
      </Stack>
      {status === "in" && locked && <LockScreen />}
    </>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
