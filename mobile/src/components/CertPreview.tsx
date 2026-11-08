import { useState } from "react";
import { View } from "react-native";
import { radius, useTheme } from "@/lib/theme";
import { WebView } from "./WebView";

/** Shows the certificate (A4 landscape HTML) scaled down to the phone's width. */
export default function CertPreview({ html }: { html: string }) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const scale = w ? w / 1122.5 : 0;
  const fitted = html
    .replace('<meta name="viewport" content="width=1123">', '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">')
    .replace("</head>", `<style>html,body{overflow:hidden;width:${w}px} .xc-page{transform:scale(${scale});transform-origin:0 0}</style></head>`);
  return (
    <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}
      style={{ width: "100%", aspectRatio: 297 / 210, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: t.line, backgroundColor: "#fff" }}>
      {scale > 0 && <WebView html={fitted} />}
    </View>
  );
}
