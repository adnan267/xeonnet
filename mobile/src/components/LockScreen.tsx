import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { space, useTheme } from "@/lib/theme";
import { Logo } from "./Logo";
import { Button, T } from "./ui";

/** Covers the app until fingerprint / Face ID succeeds. */
export default function LockScreen() {
  const t = useTheme();
  const { unlock, logout, biometricLabel, user } = useAuth();
  useEffect(() => { unlock().catch(() => {}); }, [unlock]);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.lg }]}>
      <Logo height={84} />
      <T v="h2" center>Welcome back{user?.first_name ? `, ${user.first_name}` : ""}</T>
      <T muted center>Xeon Net is locked. Use {biometricLabel ?? "your fingerprint"} to continue.</T>
      <Button title={`Unlock with ${biometricLabel ?? "fingerprint"}`} icon="finger-print" onPress={() => unlock()} style={{ alignSelf: "stretch" }} />
      <Button title="Sign out" kind="ghost" onPress={() => logout()} style={{ alignSelf: "stretch" }} />
    </View>
  );
}
