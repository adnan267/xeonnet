"use client";
import { Coins as CoinIcon } from "lucide-react";
import { Status } from "./ui";

export type RTask = { id: number; title: string; kind: string; position_title: string; instructions: string; resource_url: string; proof: string; coins: number; deadline: string | null; places_left: number | null; my_status: string };
export type RSub = { id: number; task: number; task_title: string; task_coins: number; worker: number; worker_name: string; worker_email: string; text: string; link: string; status: "pending" | "approved" | "rejected"; coins: number; review_note: string; reviewed_by_name: string; reviewed_at: string | null; created_at: string };
export type RWithdrawal = { id: number; worker: number; worker_name: string; worker_email: string; worker_phone: string; coins: number; amount: string; method: string; method_label: string; account_name: string; account_number: string; bank: string; status: "pending" | "paid" | "rejected"; reference: string; staff_note: string; processed_at: string | null; created_at: string };
export type REntry = { id: number; coins: number; kind: string; kind_label: string; note: string; created_at: string };

export const KIND_LABEL: Record<string, string> = { work: "Client work", social: "Social media", training: "Training", other: "Other" };
export const rs = (v: string | number) => `Rs ${Number(v).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

export function Coins({ n }: { n: number }) {
  return <span className="coins"><CoinIcon />{n.toLocaleString()}</span>;
}

export function SubStatus({ s }: { s: string }) {
  return <Status s={s} label={{ pending: "waiting for review", approved: "approved", rejected: "needs changes" }[s]} />;
}

export function WdStatus({ s }: { s: string }) {
  return <Status s={s} label={{ pending: "requested", paid: "paid", rejected: "not paid" }[s]} />;
}
