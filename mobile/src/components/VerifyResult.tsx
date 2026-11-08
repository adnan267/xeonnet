import { View } from "react-native";
import { fdate } from "@/lib/format";
import { space, useTheme } from "@/lib/theme";
import type { PublicCert } from "@/lib/types";
import { Card, Icon, KV, Row, T } from "./ui";

export type VerifyState = { kind: "found"; cert: PublicCert } | { kind: "missing"; code: string };

export function VerifyResult({ r }: { r: VerifyState }) {
  const t = useTheme();
  if (r.kind === "missing") {
    return (
      <Card style={{ borderColor: t.bad, borderWidth: 1.5, gap: space.md }}>
        <Row gap={space.md}><Icon name="close-circle" size={34} color={t.bad} />
          <View style={{ flex: 1 }}><T v="h3">No record found</T><T v="small" muted>{r.code} was not issued by Xeon Net. Check the number and try again.</T></View>
        </Row>
      </Card>
    );
  }
  const c = r.cert;
  const valid = c.status === "valid";
  return (
    <Card style={{ borderColor: valid ? t.ok : t.bad, borderWidth: 1.5, gap: space.md, backgroundColor: valid ? t.okSoft : t.badSoft }}>
      <Row gap={space.md}>
        <Icon name={valid ? "shield-checkmark" : "warning"} size={36} color={valid ? t.ok : t.bad} />
        <View style={{ flex: 1 }}>
          <T v="h3">{valid ? "Verified: this document is genuine" : "This document has been revoked"}</T>
          <T v="small" muted>Issued by Xeon Net</T>
        </View>
      </Row>
      <View style={{ gap: 2 }}>
        <KV k="Certificate No." v={c.code} strong />
        <KV k="Issued to" v={c.holder_name} strong />
        <KV k="Document" v={c.doc_type} />
        <KV k={c.doc_type.startsWith("Internship") ? "Internship field" : "Program / role"} v={c.title} />
        <KV k="Duration" v={c.duration} />
        <KV k="Period" v={c.start_date && c.end_date ? `${fdate(c.start_date)} – ${fdate(c.end_date)}` : c.period} />
        <KV k="Date of issue" v={fdate(c.issued_on)} />
        <KV k="Status" v={valid ? "Valid" : "Revoked"} strong />
        <KV k="Remarks" v={c.note} />
      </View>
    </Card>
  );
}

/** Pulls the certificate number out of a scanned QR (a verify link) or typed text. */
export function codeFrom(raw: string) {
  const s = raw.trim();
  const m = s.match(/\/verify\/([A-Za-z0-9-]+)/);
  return (m ? m[1] : s).toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
