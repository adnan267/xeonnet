"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTitle } from "@/components/panel/AppShell";
import DocumentEditor from "@/components/panel/DocumentEditor";

function New() {
  const p = useSearchParams();
  const type = p.get("type") === "proposal" ? "proposal" : "invoice";
  useTitle(`New ${type}`);
  return <DocumentEditor type={type} clientId={p.get("client") || undefined} />;
}

export default function NewDocument() {
  return <Suspense><New /></Suspense>;
}
