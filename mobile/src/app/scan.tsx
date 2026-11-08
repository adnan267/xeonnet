import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton, Loading, Screen, T } from "@/components/ui";
import { codeFrom } from "@/components/VerifyResult";
import { space } from "@/lib/theme";

/** Camera QR scanner → opens the verification for the scanned certificate. */
export default function Scan() {
  const [perm, ask] = useCameraPermissions();
  const done = useRef(false);
  const inset = useSafeAreaInsets();

  if (Platform.OS === "web") return <Screen><T>QR scanning works in the phone app.</T><Button title="Back" onPress={() => router.back()} /></Screen>;
  if (!perm) return <Screen><Loading /></Screen>;
  if (!perm.granted) {
    return (
      <Screen style={{ flexGrow: 1, justifyContent: "center", paddingTop: inset.top + space.xl }}>
        <T v="h2" center>Allow the camera</T>
        <T muted center>Xeon Net needs the camera to read the QR code printed on a certificate.</T>
        <Button title={perm.canAskAgain ? "Allow camera" : "Open settings to allow"} icon="camera-outline" onPress={() => ask()} />
        <Button title="Type the number instead" kind="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => {
          if (done.current) return;
          const code = codeFrom(data);
          if (!/^XN-[A-Z]+-\d{4}-\d+/.test(code) && !data.includes("/verify/")) return;   // not a Xeon Net QR
          done.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.replace(`/verify/${code}`);
        }} />
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
        <View style={{ width: 250, height: 250, borderRadius: 28, borderWidth: 3, borderColor: "#F08A3C" }} />
        <T style={{ color: "#fff", marginTop: space.lg }} center>Point the camera at the QR code on the certificate</T>
      </View>
      <View style={{ position: "absolute", top: inset.top + 10, left: 16 }}>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
      </View>
    </View>
  );
}
