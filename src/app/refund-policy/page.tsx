import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import { refundPolicy } from "@/data/legal";

export const metadata: Metadata = {
  title: "Refund Policy — Mizan",
  description: "Mizan's refund policy for platform subscriptions and usage-based services.",
};

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      updatedAt="September 2026"
      sections={refundPolicy}
    />
  );
}