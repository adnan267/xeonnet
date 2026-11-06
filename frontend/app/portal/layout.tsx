"use client";
import { FileText, FolderKanban, LayoutDashboard, MessageCircle } from "lucide-react";
import AppShell, { type NavItem } from "@/components/panel/AppShell";

const nav: NavItem[] = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard },
  { href: "/portal/documents", label: "Invoices & Proposals", icon: FileText },
  { href: "/portal/projects", label: "My projects", icon: FolderKanban },
  { href: "/portal/support", label: "Support", icon: MessageCircle },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell area="portal" nav={nav}>{children}</AppShell>;
}
