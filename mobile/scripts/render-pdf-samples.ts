/** Dev check: writes the certificate + invoice HTML exactly as the app builds it (npx tsx scripts/render-pdf-samples.ts <outdir>). */
import { writeFileSync } from "node:fs";
import { certificateHtml, documentHtml } from "../src/lib/pdfHtml";
import type { Doc } from "../src/lib/types";

const out = process.argv[2] ?? ".";
writeFileSync(`${out}/cert.html`, certificateHtml({ code: "XN-INT-2026-0101", holder_name: "Hamza Tariq", doc_type: "Internship Completion Certificate",
  title: "Digital Marketing", duration: "2 Months", start_date: "2026-09-01", end_date: "2026-10-31", period: "", issued_on: "2026-11-08" }));
const doc: Doc = {
  id: 1, doc_type: "invoice", number: "XN-INV-2026-0335", title: "Social media management", issue_date: "2026-11-06", due_date: "2026-11-20",
  currency: "GBP", discount_type: "amount", discount_value: "0", tax_percent: "0", status: "sent", display_status: "partial",
  intro: "", scope: "Instagram, TikTok, Facebook\n20 short videos", timeline: "", terms: "Payment within 14 days", notes: "",
  client_detail: { id: 1, name: "Weave & Wear", company: "Weave & Wear Ltd", email: "ww@example.com", phone: "+44 7700 900123", address: "London, UK", country: "GB" },
  items: [{ description: "Monthly social media management", qty: "1", unit_price: "200" }, { description: "Short videos", qty: "20", unit_price: "2.5" }],
  payments: [{ id: 1, amount: "100", paid_on: "2026-11-07", method: "Bank transfer", note: "" }],
  totals: { subtotal: "250", discount: "0", tax: "0", total: "250", paid: "100", balance: "150" }, words: "Pounds Two Hundred and Fifty Only",
  bank: [{ label: "Bank", value: "Meezan Bank" }], accepted_at: null, sent_at: null,
};
writeFileSync(`${out}/invoice.html`, documentHtml(doc));
console.log("written");
