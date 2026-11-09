"use client";
import Link from "next/link";
import { useTitle } from "@/components/panel/AppShell";
import { Empty, useLoad } from "@/components/panel/ui";
import { fdate } from "@/lib/format";

type C = { code: string; course: string; issued_on: string; status: string };

export default function StudentCertificates() {
  useTitle("Certificates");
  const [rows, , err] = useLoad<C[]>("learn/certificates");
  if (err) return <p className="alert alert-err">{err}</p>;
  if (rows && !rows.length) return <Empty>Pass a course test to get your first certificate.</Empty>;
  return (
    <div className="grid" style={{ ["--min" as string]: "280px" }}>
      {rows?.map((c) => (
        <Link key={c.code} href={`/learn/certificates/${c.code}`} className="card card-pad stack" style={{ ["--gap" as string]: "8px" }}>
          <span className="pill" style={{ alignSelf: "flex-start" }}>{c.status === "valid" ? "Valid" : "Revoked"}</span>
          <b>{c.course}</b>
          <span className="muted small">{c.code} · {fdate(c.issued_on)}</span>
          <span className="link small">View &amp; download →</span>
        </Link>
      ))}
    </div>
  );
}
