"use client";
import { useParams } from "next/navigation";
import type { Doc } from "@/components/DocPaper";
import { useTitle } from "@/components/panel/AppShell";
import DocumentEditor from "@/components/panel/DocumentEditor";
import { useLoad } from "@/components/panel/ui";

export default function EditDocument() {
  const { id } = useParams<{ id: string }>();
  const [doc, , err] = useLoad<Doc>(`staff/documents/${id}`);
  useTitle(doc ? `Edit ${doc.number}` : "Edit");
  if (err) return <p className="alert alert-err">{err}</p>;
  return doc ? <DocumentEditor doc={doc} type={doc.doc_type} /> : <p className="muted">Loading…</p>;
}
