import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import type { Theme } from "@/lib/theme";

type Name = ComponentProps<typeof Ionicons>["name"];

/** Shared look for the bottom tab bars (website, staff, client). */
export function tabOptions(t: Theme) {
  return {
    headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
    headerTitleStyle: { fontWeight: "800" as const, fontSize: 19 }, headerTitleAlign: "left" as const,
    tabBarActiveTintColor: t.brandText, tabBarInactiveTintColor: t.faint,
    tabBarStyle: { backgroundColor: t.card, borderTopColor: t.line },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
    sceneStyle: { backgroundColor: t.bg },
  };
}

export function tabIcon(on: Name, off: Name) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? on : off} size={size - 2} color={String(color)} />;
  };
}
