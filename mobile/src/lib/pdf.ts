import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export { certificateHtml, documentHtml, qrSvg, verifyUrl } from "./pdfHtml";

// ---------------------------------------------------------------- make + share
async function makePdf(html: string, fileName: string, landscape: boolean) {
  const size = landscape ? { width: 842, height: 595 } : { width: 595, height: 842 };
  const { uri } = await Print.printToFileAsync({ html, ...size, margins: landscape ? { left: 0, right: 0, top: 0, bottom: 0 } : undefined });
  try {
    const named = new File(Paths.cache, `${fileName.replace(/[^\w.-]+/g, "-")}.pdf`);
    if (named.exists) named.delete();
    new File(uri).move(named);
    return named.uri;
  } catch {
    return uri;
  }
}

/** Builds the PDF and opens the share sheet (WhatsApp, email, save to files…). */
export async function sharePdf(kind: "document" | "certificate", html: string, fileName: string) {
  if (Platform.OS === "web") { await Print.printAsync({ html }); return; }
  const uri = await makePdf(html, fileName, kind === "certificate");
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: `Share ${fileName}` });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function printHtml(html: string, landscape = false) {
  if (Platform.OS === "web") return Print.printAsync({ html });
  return Print.printAsync({ html, ...(landscape ? { width: 842, height: 595, orientation: Print.Orientation.landscape } : {}) });
}
