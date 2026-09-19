import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import { cookiePolicy } from "@/data/legal";

export const metadata: Metadata = {
  title: "Cookie Policy — Mizan",
  description: "How Mizan uses cookies, local storage, and optional services on its platform.",
};

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      updatedAt="September 2026"
      sections={cookiePolicy}
    />
  );
}