import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import { api } from "./api";
import type { User } from "./auth";

// Show notifications as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export type PushResult = { ok: true } | { ok: false; reason: string };

/**
 * Ask for permission and send this phone's push token to Xeon Net.
 * Needs a real phone and the EAS project id (app.json → extra.eas.projectId).
 */
export async function registerForPush(): Promise<PushResult> {
  if (Platform.OS === "web") return { ok: false, reason: "Notifications work in the phone app only." };
  if (!Device.isDevice) return { ok: false, reason: "Notifications need a real phone (not an emulator)." };
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Xeon Net", importance: AndroidImportance.HIGH, lightColor: "#E5701A", vibrationPattern: [0, 200, 120, 200],
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return { ok: false, reason: "Notifications are turned off for Xeon Net in your phone settings." };
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { ok: false, reason: "This build is not linked to the Xeon Net push service yet." };
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api("auth/app/push", { body: { push_token: data } });
  return { ok: true };
}

export async function unregisterPush() {
  try { await api("auth/app/push", { body: { push_token: "" } }); } catch { /* ignore */ }
}

/** Where a tapped notification should open. */
export function openFromNotification(data: Record<string, unknown> | undefined, user: User | null) {
  if (!data || !user) return;
  const id = data.id != null ? String(data.id) : "";
  const staff = !user.is_client;
  switch (data.type) {
    case "document": router.push(staff ? `/staff/document/${id}` : `/portal/document/${id}`); break;
    case "project": router.push(staff ? `/staff/project/${id}` : `/portal/project/${id}`); break;
    case "task": router.push("/staff/work"); break;
    case "message": router.push("/staff/inbox"); break;
    case "portal": router.push("/portal"); break;
  }
}
