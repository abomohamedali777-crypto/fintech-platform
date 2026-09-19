"use client";

import { useState, useEffect } from "react";
import { Scale, Menu, X } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useSettings } from "@/lib/site";
import { ThemeToggle, LangPicker } from "@/components/SettingsControls";
import Magnetic from "@/components/Magnetic";
import type { TKey, ExtraKey } from "@/data/translations";

type NavItem = "solutions" | "platform" | "security" | "faq";

const links: { href: string; target: NavItem; key: TKey | ExtraKey }[] = [
  { key: "nav.solutions", href: "#solutions", target: "solutions" },
  { key: "nav.platform", href: "#platform", target: "platform" },
  { key: "nav.security", href: "#security", target: "security" },
  { key: "nav.faq", href: "#faq", target: "faq" },
];

export default function Navbar() {
  const { t } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (link: (typeof links)[number]) => {
    document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-out ${
        scrolled
          ? "border-b border-slate-800 bg-canvas/85 backdrop-blur-xl"
          : "bg-canvas/85 backdrop-blur-xl"
      }`}
    >
      <motion.div
        style={{ scaleX: progress }}
        className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-[#8a6a2a] via-[#d9ae4e] to-[#f0d285]"
      />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Mizan home">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-[#b48f47] via-[#8a6a2a] to-[#5c4512] shadow-[0_4px_14px_rgba(161,98,7,0.35)] ring-1 ring-[#d9ae4e]/40">
            <Scale className="h-4 w-4 text-white" strokeWidth={1.75} />
          </span>
          <span className="font-serif text-[20px] font-semibold tracking-tight text-ink">Mizan</span>
          <span className="hidden rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-accent sm:inline-block">
            {t("footer.platform")}
          </span>
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <li key={link.target}>
              <button
                onClick={() => goTo(link)}
                className="text-[13px] font-medium tracking-tight text-slate transition-colors duration-300 ease-out hover:text-ink"
              >
                {t(link.key)}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1 lg:flex">
            <ThemeToggle />
            <LangPicker />
          </div>
          <Magnetic className="hidden sm:block" strength={0.25}>
            <a
              href="#access"
              className="inline-flex rounded-md bg-gradient-to-b from-accent to-accent-strong px-5 py-2.5 text-[13px] font-semibold tracking-tight text-white shadow-micro transition-all duration-300 ease-out hover:brightness-110"
            >
              {t("requestAccess")}
            </a>
          </Magnetic>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-300 ease-out hover:bg-mist lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-ink" />
            ) : (
              <Menu className="h-5 w-5 text-ink" />
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-800 bg-canvas/95 backdrop-blur-md lg:hidden animate-fade-in">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <li key={link.target}>
                <button
                  onClick={() => goTo(link)}
                  className="block w-full rounded-md px-3 py-2.5 text-left text-[13px] font-medium tracking-tight text-slate transition-colors duration-300 ease-out hover:bg-mist hover:text-ink"
                >
                  {t(link.key)}
                </button>
              </li>
            ))}
            <li className="mt-2 flex items-center gap-2 border-t border-slate-800 pt-4">
              <ThemeToggle />
              <LangPicker />
            </li>
            <li className="pt-2">
              <a
                href="#access"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md bg-gradient-to-b from-accent to-accent-strong px-5 py-3 text-center text-[13px] font-semibold tracking-tight text-white shadow-micro transition-all duration-300 ease-out hover:brightness-110"
              >
                {t("requestAccess")}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}