import { createElement } from "react";

/** Web preview: same page in an iframe. */
export function WebView({ html }: { html: string; scale?: number }) {
  return createElement("iframe", { srcDoc: html, style: { border: 0, width: "100%", height: "100%", background: "#fff" }, title: "Preview" });
}
