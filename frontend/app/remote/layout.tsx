"use client";
import { ClipboardList, History, LayoutDashboard, UserRound, Wallet } from "lucide-react";
import AppShell, { type NavItem } from "@/components/panel/AppShell";

const nav: NavItem[] = [
  { href: "/remote", label: "Dashboard", icon: LayoutDashboard },
  { href: "/remote/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/remote/submissions", label: "My work", icon: History },
  { href: "/remote/wallet", label: "Wallet", icon: Wallet },
  { href: "/remote/profile", label: "Profile & payout", icon: UserRound },
];

export default function RemoteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell area="remote" nav={nav}>{children}</AppShell>;
}
