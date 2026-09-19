"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Intelligence from "@/components/Intelligence";
import Services from "@/components/Services";
import BentoGrid from "@/components/BentoGrid";
import Calculator from "@/components/Calculator";
import Security from "@/components/Security";
import FAQ from "@/components/FAQ";
import RequestAccess from "@/components/RequestAccess";
import Footer from "@/components/Footer";
import LegalModal, { type LegalTab } from "@/components/LegalModal";
import CookieBanner from "@/components/CookieBanner";

export default function Home() {
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("privacy");

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const closeLegal = () => setLegalOpen(false);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Intelligence />
        <Services />
        <BentoGrid />
        <Calculator />
        <Security />
        <FAQ />
        <RequestAccess onOpenPrivacy={() => openLegal("privacy")} />
      </main>
      <Footer />
      <LegalModal open={legalOpen} initialTab={legalTab} onClose={closeLegal} />
      <CookieBanner onOpenPrivacy={() => openLegal("privacy")} onOpenTerms={() => openLegal("terms")} />
    </>
  );
}