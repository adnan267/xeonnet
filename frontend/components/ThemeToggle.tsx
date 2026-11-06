"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function getTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.dataset.theme as "dark" | "light") || "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => setTheme(getTheme()), []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
    setTheme(next);
  };
  return (
    <button className="icon-btn" type="button" onClick={flip} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Change theme">
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}

/** Inline script for <head>: sets the theme before the page paints (no flash). */
export const themeScript = `(function(){document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;
