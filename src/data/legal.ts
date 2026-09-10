import {
  Fingerprint,
  Lock,
  ShieldCheck,
  KeyRound,
  Landmark,
  Globe2,
  Gavel,
  Scale,
  FileCheck,
} from "lucide-react";

export type LegalSection = {
  heading: string;
  icon: typeof Lock;
  paragraphs: string[];
};

export const privacyPolicy: LegalSection[] = [
  {
    heading: "1. Overview & Data Controller",
    icon: Fingerprint,
    paragraphs: [
      "This Privacy Policy governs the processing of personal and corporate data collected through our B2B FinTech software infrastructure. We act as a data processor for institutional clients and a data controller for direct account management data.",
    ],
  },
  {
    heading: "2. Information We Collect",
    icon: FileCheck,
    paragraphs: [
      "Corporate Identity Data: Business registration details, corporate structure, ultimate beneficial owner (UBO) information, tax identification numbers.",
      "Contact & Account Data: Names, business email addresses, phone numbers, and API authentication credentials of authorized personnel.",
      "Transactional & System Telemetry: API request/response logs, transaction volumes, IP addresses, network routing data, and system performance metrics.",
    ],
  },
  {
    heading: "3. Legal Basis & Purpose of Processing",
    icon: Gavel,
    paragraphs: [
      "We process collected data under strict legal grounds:",
      "Regulatory Compliance: Meeting Anti-Money Laundering (AML), Counter-Financing of Terrorism (CFT), and Know Your Customer (KYC) obligations.",
      "Contractual Performance: Delivering automated liquidity, routing API calls, and enforcing security protocols.",
      "Fraud Prevention & Security: Monitoring unauthorized access, detecting anomaly patterns, and protecting enterprise infrastructure.",
    ],
  },
  {
    heading: "4. Data Protection & Encryption Standards",
    icon: Lock,
    paragraphs: [
      "All data in transit is encrypted using TLS 1.3 standards. Data at rest is secured via AES-256 enterprise encryption. Hardware security modules (HSM) manage cryptographic key storage in compliance with ISO/IEC 27001 and SOC 2 Type II benchmarks.",
    ],
  },
  {
    heading: "5. Data Sharing & Third Parties",
    icon: Landmark,
    paragraphs: [
      "We do not sell, rent, or trade financial or operational data. Data is shared exclusively with:",
      "Tier-1 Banking Partners & Licensed Custodians required to complete requested fiat transactions.",
      "Cloud Infrastructure Providers under strict Data Processing Agreements (DPAs).",
      "Regulatory Authorities when compelled by valid legal subpoenas or statutory mandates.",
    ],
  },
  {
    heading: "6. International Data Transfers & User Rights",
    icon: Globe2,
    paragraphs: [
      "Transfers of data across borders comply with international mechanisms (GDPR Standard Contractual Clauses and regional data protection frameworks). Enterprise users retain the right to inspect, audit, correct, or request deletion of account operator data by contacting security@enterprise.com.",
    ],
  },
];

export const termsAndConditions: LegalSection[] = [
  {
    heading: "1. Agreement & Acceptance",
    icon: FileCheck,
    paragraphs: [
      "By executing an API integration or accessing this web application, you acknowledge that you represent a validly incorporated business entity and agree to be bound by these Terms and Conditions.",
    ],
  },
  {
    heading: "2. Scope of Service & Disclaimer",
    icon: Scale,
    paragraphs: [
      "Our platform provides API software and technical infrastructure for B2B financial orchestration. Unless explicitly licensed in specific jurisdictions, we act as a technology service provider and do not directly hold un-segregated retail consumer deposits.",
    ],
  },
  {
    heading: "3. Account Integrity & API Key Security",
    icon: KeyRound,
    paragraphs: [
      "Enterprise clients are solely responsible for maintaining the confidentiality of API credentials, client secrets, and access tokens.",
      "Any automated transaction or programmatic request initiated using valid API keys is legally attributed to the account holder.",
    ],
  },
  {
    heading: "4. Acceptable Use Policy",
    icon: ShieldCheck,
    paragraphs: [
      "Users strictly agree NOT to:",
      "Utilize the infrastructure for illicit trade, sanction evasion, or illegal money laundering operations.",
      "Attempt reverse-engineering, vulnerability exploitation, or unauthorized penetration testing against platform endpoints without written consent.",
      "Exceed agreed-upon rate limits or flood system infrastructure with malicious automated traffic.",
    ],
  },
  {
    heading: "5. Limitation of Liability & Indemnification",
    icon: Gavel,
    paragraphs: [
      "To the maximum extent permitted by governing law:",
      "In no event shall the company be liable for indirect, incidental, special, or consequential damages, including operational downtime, lost profits, or financial market slippage.",
      "Maximum aggregate liability arising from system failure shall not exceed the total platform fees paid by the client in the preceding 3-month period.",
    ],
  },
  {
    heading: "6. Service Level Agreement (SLA) & Termination",
    icon: Globe2,
    paragraphs: [
      "System uptime targets (99.99%) are monitored in real time. We reserve the right to immediately suspend API access, revoke credentials, or freeze integration pipelines in cases of suspected security breaches, fraud, or material breach of these Terms.",
    ],
  },
  {
    heading: "7. Governing Law & Jurisdiction",
    icon: Scale,
    paragraphs: [
      "These Terms shall be governed and interpreted under the laws of the United Arab Emirates (and/or Delaware, USA, where corporate structuring dictates). Disputes shall be submitted to binding arbitration in accordance with institutional arbitration rules.",
    ],
  },
];