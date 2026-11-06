"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Fades in every element with class "reveal" as it scrolls into view. */
export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e, i) => { e.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`; io.observe(e); });
    return () => io.disconnect();
  }, [path]);
  return null;
}
