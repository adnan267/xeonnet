import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Alert, Button, Card, Field, Row, Screen, T } from "@/components/ui";
import { VerifyResult, codeFrom, type VerifyState } from "@/components/VerifyResult";
import { space } from "@/lib/theme";
import { verifyCode } from "@/lib/verify";

export default function Verify() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<VerifyState | null>(null);
  const [err, setErr] = useState("");

  const check = useCallback(async (raw: string) => {
    const c = codeFrom(raw);
    if (!c) { setErr("Type the certificate number, e.g. XN-INT-2026-0101."); return; }
    setCode(c); setBusy(true); setErr(""); setRes(null);
    try { setRes(await verifyCode(c)); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }, []);

  // coming back from the scanner with a code
  useFocusEffect(useCallback(() => { if (params.code) { check(params.code); router.setParams({ code: undefined }); } }, [params.code, check]));

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T v="h1">Verify a certificate</T>
        <T muted>Check that a certificate or letter was really issued by Xeon Net.</T>
      </View>
      <Card style={{ gap: space.md }}>
        <Field label="Certificate number" value={code} onChangeText={setCode} placeholder="XN-INT-2026-0101" autoCapitalize="characters"
          autoCorrect={false} returnKeyType="search" onSubmitEditing={() => check(code)} />
        <Row>
          <Button title="Verify" icon="shield-checkmark-outline" loading={busy} onPress={() => check(code)} style={{ flex: 1 }} />
          <Button title="Scan QR" kind="soft" icon="qr-code-outline" onPress={() => router.push("/scan")} style={{ flex: 1 }} />
        </Row>
      </Card>
      {err ? <Alert text={err} /> : null}
      {res ? <VerifyResult r={res} /> : null}
    </Screen>
  );
}
