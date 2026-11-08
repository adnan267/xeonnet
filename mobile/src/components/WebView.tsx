import { WebView as RNWebView } from "react-native-webview";

/** Renders a self-contained HTML page (used for the certificate preview). */
export function WebView({ html }: { html: string; scale?: number }) {
  return <RNWebView originWhitelist={["*"]} source={{ html }} scrollEnabled={false} style={{ flex: 1, backgroundColor: "#fff" }} />;
}
