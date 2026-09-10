import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import { privacyPolicy } from "@/data/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Meridian",
  description: "How Meridian processes personal and corporate data on its B2B FinTech infrastructure.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updatedAt="September 2026"
      sections={privacyPolicy}
    />
  );
}