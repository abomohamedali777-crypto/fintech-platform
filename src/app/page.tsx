"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BentoGrid from "@/components/BentoGrid";
import Calculator from "@/components/Calculator";
import Security from "@/components/Security";
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
      <Navbar onOpenLegal={openLegal} />
      <main>
        <Hero />
        <BentoGrid />
        <Calculator />
        <Security />
        <RequestAccess />
      </main>
      <Footer onOpenLegal={openLegal} />
      <LegalModal open={legalOpen} initialTab={legalTab} onClose={closeLegal} />
      <CookieBanner onOpenPrivacy={() => openLegal("privacy")} onOpenTerms={() => openLegal("terms")} />
    </>
  );
}