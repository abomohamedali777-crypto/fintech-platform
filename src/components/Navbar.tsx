"use client";

import { useState, useEffect } from "react";
import { Github, Menu, X } from "lucide-react";

type NavItem = "product" | "infrastructure" | "security" | "privacy" | "terms";

const links: { label: string; href: string; target: NavItem }[] = [
  { label: "Product", href: "#product", target: "product" },
  { label: "Infrastructure", href: "#infrastructure", target: "infrastructure" },
  { label: "Security", href: "#security", target: "security" },
  { label: "Privacy", href: "#privacy", target: "privacy" },
  { label: "Terms", href: "#terms", target: "terms" },
];

export default function Navbar({
  onOpenLegal,
}: {
  onOpenLegal: (tab: "privacy" | "terms") => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-out ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-micro border-b hairline"
          : "bg-white/60 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Meridian home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
            <Github className="h-4 w-4 text-white" strokeWidth={1.75} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Meridian
          </span>
          <span className="hidden rounded-full border hairline bg-mist px-2 py-0.5 text-[11px] font-medium tracking-wide text-slate sm:inline-block">
            Platform
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.target}>
              <a
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (link.target === "privacy" || link.target === "terms") {
                    onOpenLegal(link.target);
                  } else {
                    document
                      .querySelector(link.href)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#access"
            className="hidden rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110 sm:inline-flex"
          >
            Request Access
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
        <div className="border-t hairline bg-white/95 backdrop-blur-md md:hidden animate-fade-in">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <li key={link.target}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    if (link.target === "privacy" || link.target === "terms") {
                      onOpenLegal(link.target);
                    } else {
                      document
                        .querySelector(link.href)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="block rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:bg-mist hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#access"
                onClick={() => setMobileOpen(false)}
                className="block rounded-full bg-accent px-5 py-3 text-center text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110"
              >
                Request Access
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}