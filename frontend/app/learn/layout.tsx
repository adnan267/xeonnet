"use client";
import { Award, LayoutDashboard, Search, UserRound } from "lucide-react";
import AppShell, { type NavItem } from "@/components/panel/AppShell";

const nav: NavItem[] = [
  { href: "/learn", label: "My courses", icon: LayoutDashboard },
  { href: "/learn/certificates", label: "Certificates", icon: Award },
  { href: "/courses", label: "Browse courses", icon: Search },
  { href: "/learn/profile", label: "Profile", icon: UserRound },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <AppShell area="learn" nav={nav}>{children}</AppShell>;
}
