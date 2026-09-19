import {
  Fingerprint,
  Lock,
  ShieldCheck,
  KeyRound,
  FileCheck,
  Cookie,
  Globe2,
  Scale,
  Gavel,
  RefreshCcw,
} from "lucide-react";

export type LegalSection = {
  heading: string;
  icon: typeof Lock;
  paragraphs: string[];
};

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mizan.pay";

export const privacyPolicy: LegalSection[] = [
  {
    heading: "1. What This Policy Covers",
    icon: Fingerprint,
    paragraphs: [
      "This is the design demonstration website for Mizan, a planned B2B payments-infrastructure product. This policy describes how this site handles the small amount of information it collects today.",
    ],
  },
  {
    heading: "2. Information We Collect",
    icon: FileCheck,
    paragraphs: [
      "The only personal data this site collects is what you submit through the 'Request Access' form: your business email address, and optionally a company name and monthly transaction volume.",
      "For abuse protection we also store a salted hash of your IP address and your browser's user-agent string. The raw IP address is never stored.",
    ],
  },
  {
    heading: "3. How That Data Is Processed",
    icon: Lock,
    paragraphs: [
      "Email addresses are stored and transmitted in TLS-encrypted traffic. The email address is kept so a human can follow up on your request; it is never sold or shared with third parties.",
      "A honeypot field silently discards automated submissions; submissions that trip it are not recorded.",
    ],
  },
  {
    heading: "4. Retention & Your Rights",
    icon: Globe2,
    paragraphs: [
      "Request records are retained only for as long as they are needed to evaluate your inquiry, and are deleted on request.",
      "To request access, correction, or deletion of your data, email security@mizan.pay.",
    ],
  },
  {
    heading: "5. No Financial Services",
    icon: Scale,
    paragraphs: [
      "This site is a design demonstration. It does not collect payments, hold deposits, process transactions, or provide financial services of any kind.",
    ],
  },
];

export const termsAndConditions: LegalSection[] = [
  {
    heading: "1. Demonstration Status",
    icon: FileCheck,
    paragraphs: [
      "This website is a design demonstration for a planned B2B payments-infrastructure product. No paid service is currently offered and no agreement to provide services is formed by browsing this site or submitting the request form.",
    ],
  },
  {
    heading: "2. Use of the Website",
    icon: ShieldCheck,
    paragraphs: [
      "You may browse the site and submit a non-binding request to be contacted about the product. You agree not to use automated tools to abuse, scrape, or overload the site.",
    ],
  },
  {
    heading: "3. No Warranty",
    icon: Scale,
    paragraphs: [
      "All functionality, metrics, certifications, and team information shown on this site are illustrative and provided 'as is', without any representation or warranty.",
    ],
  },
  {
    heading: "4. Limitation of Liability",
    icon: Gavel,
    paragraphs: [
      "To the maximum extent permitted by law, the operator of this demonstration site shall not be liable for any damages arising from its use.",
    ],
  },
];

export const cookiePolicy: LegalSection[] = [
  {
    heading: "1. Storage This Site Uses",
    icon: Cookie,
    paragraphs: [
      "This site stores small amounts of information in your browser's localStorage (not tracking cookies). This covers your theme preference, language preference, and your consent choice for optional resources.",
    ],
  },
  {
    heading: "2. Essential Preferences",
    icon: ShieldCheck,
    paragraphs: [
      "Theme (light/dark), language, and consent settings are kept in localStorage so the site renders consistently on your next visit. These are always stored and do not require consent.",
    ],
  },
  {
    heading: "3. Optional Resources",
    icon: FileCheck,
    paragraphs: [
      "Brand fonts are loaded from Google Fonts only if you accept. No analytics, advertising, or tracking cookies are ever set.",
      "You control this via the cookie banner (Accept All, Reject Non-Essential, or Preferences). Your choice is stored locally and can be changed at any time.",
    ],
  },
  {
    heading: "4. Contact",
    icon: Lock,
    paragraphs: [
      `Questions about this site's cookie and storage practices can be directed to ${CONTACT_EMAIL}.`,
    ],
  },
];

export const refundPolicy: LegalSection[] = [
  {
    heading: "1. Payment Status",
    icon: RefreshCcw,
    paragraphs: [
      "This site does not collect payments, subscriptions, or fees. There is therefore nothing to refund.",
    ],
  },
  {
    heading: "2. Future Products",
    icon: FileCheck,
    paragraphs: [
      "When Mizan product pricing and payments are launched, a refund policy will be published here in advance of any charge being collected.",
    ],
  },
  {
    heading: "3. Questions",
    icon: KeyRound,
    paragraphs: [
      `Questions about this page can be directed to ${CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: "4. Governing Law",
    icon: Gavel,
    paragraphs: [
      "These placeholder terms are for the design demonstration only and do not create a contractual relationship.",
    ],
  },
];