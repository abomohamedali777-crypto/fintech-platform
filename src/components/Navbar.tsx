"use client";

import { useState, useEffect } from "react";
import { Scale, Menu, X } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useSettings } from "@/lib/site";
import { ThemeToggle, LangPicker } from "@/components/SettingsControls";

type NavItem = "product" | "infrastructure" | "security" | "privacy" | "terms";

const links: { href: string; target: NavItem; key: "nav.product" | "nav.infrastructure" | "nav.security" | "nav.privacy" | "nav.terms" }[] = [
  { key: "nav.product", href: "#product", target: "product" },
  { key: "nav.infrastructure", href: "#infrastructure", target: "infrastructure" },
  { key: "nav.security", href: "#security", target: "security" },
  { key: "nav.privacy", href: "#privacy", target: "privacy" },
  { key: "nav.terms", href: "#terms", target: "terms" },
];

export default function Navbar({
  onOpenLegal,
}: {
  onOpenLegal: (tab: "privacy" | "terms") => void;
}) {
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
    if (link.target === "privacy" || link.target === "terms") {
      onOpenLegal(link.target);
    } else {
      document
        .querySelector(link.href)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-out ${
        scrolled
          ? "bg-canvas/80 backdrop-blur-md shadow-micro border-b hairline"
          : "bg-canvas/60 backdrop-blur-md"
      }`}
    >
      <motion.div
        style={{ scaleX: progress }}
        className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-accent via-accent/70 to-transparent"
      />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Mizan home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel">
            <Scale className="h-4 w-4 text-white" strokeWidth={1.75} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Mizan
          </span>
          <span className="hidden rounded-full border hairline bg-mist px-2 py-0.5 text-[11px] font-medium tracking-wide text-slate sm:inline-block">
            {t("footer.platform")}
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.target}>
              <button
                onClick={() => goTo(link)}
                className="text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:text-ink"
              >
                {t(link.key)}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1 md:flex">
            <ThemeToggle />
            <LangPicker />
          </div>
          <a
            href="#access"
            className="hidden rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110 sm:inline-flex"
          >
            {t("requestAccess")}
          </a>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300 ease-out hover:bg-mist md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
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
        <div className="border-t hairline bg-canvas/95 backdrop-blur-md md:hidden animate-fade-in">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <li key={link.target}>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    goTo(link);
                  }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:bg-mist hover:text-ink"
                >
                  {t(link.key)}
                </button>
              </li>
            ))}
            <li className="mt-2 flex items-center gap-2 border-t hairline pt-4">
              <ThemeToggle />
              <LangPicker />
            </li>
            <li className="pt-2">
              <a
                href="#access"
                onClick={() => setMobileOpen(false)}
                className="block rounded-full bg-accent px-5 py-3 text-center text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110"
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