/** HTML for the PDFs made on the phone (no React Native imports, so it can be tested in Node). */
import qrcode from "qrcode-generator";
import { company } from "./content";
import { fdate, longDate, money } from "./format";
import { CERT_CSS, LOGO, SEAL } from "./pdfAssets";
import type { Cert, Doc } from "./types";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const lines = (t: string) => (t || "").split("\n").map((x) => x.trim()).filter(Boolean);
const n = (v: string | number) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });

export const verifyUrl = (code: string) => `https://${company.domain}/verify/${code}`;

export function qrSvg(text: string, cell = 8) {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: cell, margin: 0, scalable: true });
}

// ---------------------------------------------------------------- proposal / invoice
const PAPER_CSS = `
*{box-sizing:border-box} body{margin:0;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1b1b1b;font-size:12.5px;line-height:1.5}
@page{size:A4;margin:14mm}
.paper{border-top:6px solid #E5701A;padding-top:18px}
h5{margin:0 0 5px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8a8378}
p{margin:0 0 .45em}
.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #eee}
.head img{width:140px;height:auto}
.title{text-align:right} .title h1{font-family:Georgia,serif;font-size:26px;letter-spacing:.12em;margin:0} .title p{margin:4px 0 8px;font-weight:700}
.pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:capitalize;background:#f1ece4;color:#6b5b45}
.st-paid,.st-accepted{background:#dff3e5;color:#1e7a3c}.st-overdue,.st-rejected,.st-cancelled{background:#fde3dc;color:#b33a1c}.st-sent{background:#e3eefc;color:#1d5fa8}.st-partial{background:#fff1cc;color:#8a6200}
.meta{display:flex;gap:20px;padding:18px 0}.meta>div{flex:1}
.project{font-size:17px;font-weight:700;margin:4px 0 8px}
table{width:100%;border-collapse:collapse;margin:12px 0 6px}
th{background:#1b1b1b;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}
td{padding:9px 10px;border-bottom:1px solid #eee;vertical-align:top}
.r{text-align:right;white-space:nowrap}
.sumbox{display:flex;gap:24px;margin:12px 0 6px;align-items:flex-start}.sumbox>div:first-child{flex:1}
dl{margin:0;width:260px}dl div{display:flex;justify-content:space-between;gap:12px;padding:4px 0}dt{color:#666}dd{margin:0;font-weight:700}
.grand{border-top:2px solid #1b1b1b;margin-top:5px;padding-top:8px!important;font-size:15px}.grand dd{color:#B4500C}
.block{margin-top:16px;break-inside:avoid}.block ul{margin:0;padding-left:18px;color:#444}
.foot{margin-top:24px;display:flex;flex-wrap:wrap;gap:10px 40px;align-items:flex-end}
.sign{min-width:190px}.sign span{display:block;border-bottom:1px solid #1b1b1b;height:36px;margin-bottom:6px}.sign small{display:block;color:#777}
.thanks{flex-basis:100%;text-align:center;color:#8a8378;font-size:11px;margin-top:6px;padding-top:10px;border-top:1px solid #eee}
tr{break-inside:avoid}`;

export function documentHtml(d: Doc) {
  const c = d.client_detail, t = d.totals, cur = d.currency;
  const list = (title: string, items: string[]) => items.length ? `<section class="block"><h5>${title}</h5><ul>${items.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></section>` : "";
  const rows = d.items.map((i, k) => `<tr><td>${k + 1}</td><td>${esc(i.description)}</td><td class="r">${n(i.qty)}</td><td class="r">${esc(money(i.unit_price, cur))}</td><td class="r">${esc(money(Number(i.qty) * Number(i.unit_price), cur))}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${PAPER_CSS}</style></head><body><article class="paper">
<header class="head"><img src="${LOGO}" alt="Xeon Net"><div class="title"><h1>${d.doc_type.toUpperCase()}</h1><p>${esc(d.number)}</p><span class="pill st-${esc(d.display_status)}">${esc(d.display_status)}</span></div></header>
<section class="meta">
<div><h5>From</h5><p><b>${esc(company.name)}</b><br>${esc(company.address)}<br>${esc(company.phone)}<br>${esc(company.email)}<br>${esc(company.domain)}</p></div>
<div><h5>${d.doc_type === "proposal" ? "Prepared for" : "Bill to"}</h5><p><b>${esc(c.name)}</b>${c.company ? `<br>${esc(c.company)}` : ""}${c.address ? `<br>${esc(c.address)}` : ""}${c.phone ? `<br>${esc(c.phone)}` : ""}${c.email ? `<br>${esc(c.email)}` : ""}</p></div>
<div><h5>Details</h5><p>Issued: <b>${esc(fdate(d.issue_date))}</b>${d.due_date ? `<br>${d.doc_type === "proposal" ? "Valid until" : "Due"}: <b>${esc(fdate(d.due_date))}</b>` : ""}<br>Currency: <b>${esc(cur)}</b></p></div>
</section>
${d.title ? `<h2 class="project">${esc(d.title)}</h2>` : ""}${d.intro ? `<p style="color:#444">${esc(d.intro)}</p>` : ""}
<table><thead><tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sumbox"><div><h5>Amount in words</h5><p style="color:#555">${esc(d.words)}</p></div><dl>
<div><dt>Subtotal</dt><dd>${esc(money(t.subtotal, cur))}</dd></div>
${Number(t.discount) > 0 ? `<div><dt>Discount${d.discount_type === "percent" ? ` (${n(d.discount_value)}%)` : ""}</dt><dd>− ${esc(money(t.discount, cur))}</dd></div>` : ""}
${Number(t.tax) > 0 ? `<div><dt>Tax (${n(d.tax_percent)}%)</dt><dd>${esc(money(t.tax, cur))}</dd></div>` : ""}
<div class="grand"><dt>Total</dt><dd>${esc(money(t.total, cur))}</dd></div>
${d.doc_type === "invoice" && Number(t.paid) > 0 ? `<div><dt>Paid</dt><dd>− ${esc(money(t.paid, cur))}</dd></div><div class="grand"><dt>Balance due</dt><dd>${esc(money(t.balance, cur))}</dd></div>` : ""}
</dl></div>
${list("Scope of work", lines(d.scope))}${list("Timeline", lines(d.timeline))}
${d.doc_type === "invoice" && d.payments.length ? list("Payments received", d.payments.map((p) => `${fdate(p.paid_on)} · ${money(p.amount, cur)}${p.method ? ` · ${p.method}` : ""}`)) : ""}
${d.doc_type === "invoice" && d.bank.length ? `<section class="block"><h5>Payment details</h5><p>${d.bank.map((b) => `${esc(b.label)}: <b>${esc(b.value)}</b>`).join("<br>")}</p></section>` : ""}
${list("Terms &amp; conditions", lines(d.terms))}
${d.notes ? `<section class="block"><h5>Notes</h5><p style="white-space:pre-line">${esc(d.notes)}</p></section>` : ""}
<footer class="foot"><div class="sign"><span></span><b>${esc(company.ceo)}</b><small>CEO, ${esc(company.name)}</small></div>
${d.doc_type === "proposal" ? `<div class="sign"><span></span><b>${d.accepted_at ? `Accepted online · ${esc(fdate(d.accepted_at))}` : "Client approval"}</b><small>Signature &amp; date</small></div>` : ""}
<p class="thanks">Thank you for choosing ${esc(company.name)} · ${esc(company.phone)} · ${esc(company.email)}</p></footer>
</article></body></html>`;
}

// ---------------------------------------------------------------- certificate (same design as the website)
const GEO = `<svg class="xc-geo" viewBox="0 0 297 210" preserveAspectRatio="none"><polygon points="227,0 230,0 297,67 297,70" fill="#d4d6da"/><polygon points="236,0 247,0 297,50 297,61" fill="#E5701A"/><polygon points="254,0 297,0 297,43" fill="#141414"/><polygon points="0,140 70,210 67,210 0,143" fill="#d4d6da"/><polygon points="0,149 61,210 50,210 0,160" fill="#E5701A"/><polygon points="0,167 43,210 0,210" fill="#141414"/></svg>`;

export function certificateHtml(c: Cert, sig: { ceo?: string; hr?: string } = {}, opts: { preview?: boolean } = {}) {
  const intern = c.doc_type.startsWith("Internship");
  const course = c.doc_type.startsWith("Course");
  const start = longDate(c.start_date), end = longDate(c.end_date);
  const focus = `${esc(c.title)}${c.title && c.duration ? "<em>•</em>" : ""}${esc(c.duration)}`;
  const period = start || end ? `<span>${intern ? "Internship Period" : course ? "Course Period" : "Period"}</span>${esc(start)} – ${esc(end)}` : esc(c.period);
  const qr = c.code && !opts.preview ? `<img alt="" src="data:image/svg+xml;utf8,${encodeURIComponent(qrSvg(verifyUrl(c.code)))}">` : "";
  const img = (src?: string) => (src ? `<img src="${src}" alt="">` : "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1123">
<style>${CERT_CSS} html,body{margin:0;padding:0;background:#fff} @page{size:297mm 210mm;margin:0} .xc-page{page-break-after:avoid}</style></head><body>
<div class="xc-page">${GEO}
<div class="xc-meta"><div><small>Certificate No.</small><b>${esc(c.code)}</b></div><div><small>Issue Date</small><b>${esc(longDate(c.issued_on))}</b></div></div>
<div class="xc-main">
<img class="xc-logo" src="${LOGO}" alt="Xeon Net">
<p class="xc-title">${intern ? "INTERNSHIP" : course ? "COURSE" : esc(c.doc_type.toUpperCase())}</p>
<p class="xc-sub">${intern || course ? "COMPLETION CERTIFICATE" : "XEON NET"}</p>
<p class="xc-lead">This certificate is proudly presented to</p>
<p class="xc-name">${esc(c.holder_name)}</p>
<div class="xc-orn"><i></i><b></b><i></i></div>
<p class="xc-body">${intern ? "In recognition of the successful completion of an internship with Xeon Net, with a focus on" : course ? "In recognition of successfully completing the Xeon Net online course and passing its final assessment in" : `Issued by Xeon Net${c.title ? " for" : "."}`}</p>
<p class="xc-focus">${focus}</p>
<p class="xc-period">${period}</p>
<p class="xc-close">${course ? "The student demonstrated commitment, a strong willingness to learn and the knowledge required by the course.<br>We wish them continued success in their professional journey." : intern ? "Throughout the program, the intern demonstrated commitment, professionalism and a strong willingness to learn.<br>We wish them continued success in their professional journey." : "We wish them continued success in their professional journey."}</p>
</div>
<div class="xc-sign-row">
<div class="xc-sign"><div class="xc-sig">${img(sig.ceo)}</div><hr><b>Muhammad Adnan</b><small>CEO · Xeon Net</small></div>
<img class="xc-seal" src="${SEAL}" alt="Xeon Net seal">
<div class="xc-sign"><div class="xc-sig">${img(sig.hr)}</div><hr><b>HR Department</b><small>Xeon Net</small></div>
</div>
<div class="xc-qr"><div class="xc-qr-box">${qr}</div><small>Scan to verify</small></div>
<div class="xc-foot"><span>www.xeonnet.site</span><i></i><span>info@xeonnet.site</span><i></i><span>0300 6666 190</span><i></i><span>Business Hub Workspace, Faisalabad</span></div>
</div></body></html>`;
}

