import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import { termsAndConditions } from "@/data/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions — Mizan",
  description: "The terms governing use of Mizan's API software and B2B financial orchestration infrastructure.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms and Conditions of Service"
      updatedAt="September 2026"
      sections={termsAndConditions}
    />
  );
}