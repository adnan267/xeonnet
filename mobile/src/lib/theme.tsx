import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

export type Theme = {
  mode: "light" | "dark";
  bg: string; card: string; cardAlt: string; line: string; text: string; soft: string; faint: string;
  brand: string; brandText: string; onBrand: string; brandSoft: string;
  ok: string; okSoft: string; bad: string; badSoft: string; info: string; infoSoft: string; warn: string; warnSoft: string; ink: string;
};

/** Brand colours, same as the website (orange · near-black · warm white). */
const light: Theme = {
  mode: "light",
  bg: "#F7F5F2", card: "#FFFFFF", cardAlt: "#F1EDE7", line: "#E6E1DA",
  text: "#161514", soft: "#5E5952", faint: "#8C867E",
  brand: "#E5701A", brandText: "#B4500C", onBrand: "#FFFFFF", brandSoft: "#FCE9DA",
  ok: "#1E7A3C", okSoft: "#DFF3E5", bad: "#B33A1C", badSoft: "#FDE3DC", info: "#1D5FA8", infoSoft: "#E3EEFC",
  warn: "#8A6200", warnSoft: "#FFF1CC", ink: "#141414",
};
const dark: Theme = {
  mode: "dark",
  bg: "#0F0F10", card: "#18181A", cardAlt: "#212124", line: "#2C2C30",
  text: "#F4F2EF", soft: "#B7B1AA", faint: "#857F78",
  brand: "#F08A3C", brandText: "#F6A266", onBrand: "#141414", brandSoft: "#3A2414",
  ok: "#5FD08A", okSoft: "#14301F", bad: "#FF8A70", badSoft: "#3A1A14", info: "#7DB4F5", infoSoft: "#14263A",
  warn: "#F2C14E", warnSoft: "#33280F", ink: "#141414",
};
export type ThemeChoice = "system" | "light" | "dark";

const Ctx = createContext<{ t: Theme; choice: ThemeChoice; setChoice: (c: ThemeChoice) => void }>({
  t: light, choice: "system", setChoice: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  useEffect(() => {
    AsyncStorage.getItem("theme").then((v) => { if (v === "light" || v === "dark" || v === "system") setChoiceState(v); }).catch(() => {});
  }, []);
  const setChoice = (c: ThemeChoice) => { setChoiceState(c); AsyncStorage.setItem("theme", c).catch(() => {}); };
  const mode = choice === "system" ? (system === "dark" ? "dark" : "light") : choice;
  const value = useMemo(() => ({ t: mode === "dark" ? dark : light, choice, setChoice }), [mode, choice]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx).t;
export const useThemeChoice = () => useContext(Ctx);

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };
