import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, Loading, Screen } from "@/components/ui";
import { VerifyResult, codeFrom, type VerifyState } from "@/components/VerifyResult";
import { verifyCode } from "@/lib/verify";

/** Opened by xeonnet.site/verify/<code> links and by the QR scanner. */
export default function VerifyCode() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = codeFrom(raw ?? "");
  const [res, setRes] = useState<VerifyState | null>(null);
  const [err, setErr] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let off = false;
    verifyCode(code).then((r) => { if (!off) setRes(r); }).catch((e) => { if (!off) setErr((e as Error).message); });
    return () => { off = true; };
  }, [code, attempt]);
  const load = () => { setErr(""); setRes(null); setAttempt((a) => a + 1); };
  return (
    <Screen>
      {err ? <><Alert text={err} /><Button title="Try again" onPress={load} /></> : res ? <VerifyResult r={res} /> : <Loading text={`Checking ${code}…`} />}
    </Screen>
  );
}
