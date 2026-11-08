import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert as RNAlert, Share } from "react-native";
import CertPreview from "@/components/CertPreview";
import { Alert, Badge, Button, Card, KV, QueryState, Row, Screen, Section } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fdate } from "@/lib/format";
import { certificateHtml, printHtml, sharePdf, verifyUrl } from "@/lib/pdf";
import { space } from "@/lib/theme";
import type { Cert } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

type Printable = Cert & { ceo_signature: string; hr_signature: string };

export default function CertificatePage() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { can } = useAuth();
  const q = useQuery<Printable>(`staff/certificates/${id}/printable`);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const c = q.data;
  const html = c ? certificateHtml(c, { ceo: c.ceo_signature, hr: c.hr_signature }) : "";

  async function run(k: string, fn: () => Promise<unknown>) {
    setBusy(k); setErr("");
    try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }
  const toggle = () => run("toggle", async () => { await api(`staff/certificates/${id}/toggle`, { body: {} }); q.refresh(); });

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}
      footer={c ? <Row>
        <Button title="Share PDF" icon="share-outline" loading={busy === "pdf"} onPress={() => run("pdf", () => sharePdf("certificate", html, `${c.code} ${c.holder_name}`))} style={{ flex: 1 }} />
        <Button title="Print" kind="dark" icon="print-outline" loading={busy === "print"} onPress={() => run("print", () => printHtml(html, true))} style={{ flex: 1 }} />
      </Row> : undefined}>
      <Stack.Screen options={{ title: c?.code ?? "Certificate" }} />
      <QueryState q={q} />
      {fresh && c && <Alert kind="ok" text={`Certificate ${c.code} issued for ${c.holder_name}.`} />}
      {err ? <Alert text={err} /> : null}
      {c && (
        <>
          {(!c.ceo_signature || !c.hr_signature) && <Alert kind="warn" text="Signature images are missing. Upload them on the website: Staff panel → Settings → Certificate signatures." />}
          <CertPreview html={html} />
          <Card style={{ gap: 2 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 4 }}><Badge status={c.status ?? "valid"} /></Row>
            <KV k="Certificate No." v={c.code} strong />
            <KV k="Name" v={c.holder_name} strong />
            <KV k="Focus" v={c.title} />
            <KV k="Duration" v={c.duration} />
            <KV k="Period" v={c.start_date && c.end_date ? `${fdate(c.start_date)} – ${fdate(c.end_date)}` : c.period} />
            <KV k="Issue date" v={fdate(c.issued_on)} />
          </Card>
          <Section title="Verification">
            <Row wrap gap={space.sm}>
              <Button small kind="soft" icon="link-outline" title="Share verify link" onPress={() => Share.share({ message: `Verify ${c.holder_name}'s Xeon Net certificate (${c.code}): ${verifyUrl(c.code)}` })} />
              {can("certificates", true) && <Button small kind={c.status === "valid" ? "danger" : "soft"} title={c.status === "valid" ? "Revoke" : "Restore"} loading={busy === "toggle"}
                onPress={() => c.status === "valid"
                  ? RNAlert.alert("Revoke certificate?", "The verify page will show it as not valid.", [{ text: "Cancel", style: "cancel" }, { text: "Revoke", style: "destructive", onPress: toggle }])
                  : toggle()} />}
            </Row>
          </Section>
        </>
      )}
    </Screen>
  );
}
