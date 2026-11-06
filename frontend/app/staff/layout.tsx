"use client";
import { Award, Bell, CheckSquare, FileText, FolderKanban, Inbox, LayoutDashboard, Settings, Users, UsersRound } from "lucide-react";
import AppShell, { type NavItem } from "@/components/panel/AppShell";

const nav: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/clients", label: "Clients", icon: Users, module: "clients" },
  { href: "/staff/documents", label: "Proposals & Invoices", icon: FileText, module: "documents" },
  { href: "/staff/projects", label: "Projects", icon: FolderKanban, module: "projects" },
  { href: "/staff/tasks", label: "My tasks", icon: CheckSquare, module: "tasks" },
  { href: "/staff/certificates", label: "Certificates", icon: Award, module: "certificates" },
  { href: "/staff/inbox", label: "Inbox & reviews", icon: Inbox, module: "inbox" },
  { href: "/staff/notifications", label: "Emails & SMS", icon: Bell, module: "notifications" },
  { href: "/staff/team", label: "Team", icon: UsersRound, module: "team" },
  { href: "/staff/settings", label: "Settings", icon: Settings, module: "settings" },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <AppShell area="staff" nav={nav}>{children}</AppShell>;
}
