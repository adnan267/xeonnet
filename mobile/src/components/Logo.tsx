import { Image } from "expo-image";
import { useTheme } from "@/lib/theme";

const DARK_BG = require("../../assets/logo-full.png");        // white text, for dark backgrounds
const LIGHT_BG = require("../../assets/logo-full-light.png");  // dark text, for light backgrounds
const MARK_DARK_BG = require("../../assets/logo-mark.png");
const MARK_LIGHT_BG = require("../../assets/logo-mark-light.png");

/** Full Xeon Net logo; switches with the theme like the website does. */
export function Logo({ height = 56, onDark }: { height?: number; onDark?: boolean }) {
  const t = useTheme();
  const dark = onDark ?? t.mode === "dark";
  return <Image source={dark ? DARK_BG : LIGHT_BG} style={{ height, width: height * (900 / 641) }} contentFit="contain" accessibilityLabel="Xeon Net" />;
}

export function Mark({ size = 28 }: { size?: number }) {
  const t = useTheme();
  return <Image source={t.mode === "dark" ? MARK_DARK_BG : MARK_LIGHT_BG} style={{ height: size, width: size * (387 / 247) }} contentFit="contain" accessibilityLabel="Xeon Net" />;
}
