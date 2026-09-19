import type { IngestInput } from "@/lib/intelligence/schema";

/**
 * DEV-ONLY fixture corpus for the first jurisdiction (UAE).
 *
 * These records are **development fixtures**, not production authoritative
 * extracts. The titles, publishers, dates, and official-portal URLs describe
 * real, well-known UAE legal/regulatory instruments, but the `content` is a
 * concise working SUMMARY written for development and model testing — it is
 * NOT verbatim official text and must be replaced by an authoritative
 * ingestion adapter before production. Every record is flagged `fixture: true`
 * so the UI, citations, and meta can label it honestly.
 *
 * Replace these via `runIngestion(liveAdapter, corpus, …)` — see
 * INTELLIGENCE.md for the exact manual setup required.
 */

const DEV_NOTE =
  "Development fixture summary — replace with verbatim authoritative source text via a live ingestion adapter before production.";

export const uaeFixtureDocuments: IngestInput[] = [
  {
    title:
      "Federal Decree-Law No. 14 of 2018 on the Central Bank of the UAE and the Regulation of Financial Institutions and Financial Activities",
    publisher: "Central Bank of the UAE",
    jurisdiction: "uae",
    documentType: "legislation",
    publicationDate: "2018",
    sourceUrl: "https://www.centralbank.ae",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The Central Bank of the UAE is the federal authority responsible for licensing, regulating, and supervising financial institutions and financial activities in or from the UAE. Under the law, no person may carry on a financial activity in the UAE without prior authorisation from the Central Bank. The framework covers regulated financial activities broadly, including payment services and stored value facilities, and grants the Central Bank powers to issue regulations, set licensing conditions, conduct supervision, and impose administrative sanctions for non-compliance. Fintech firms providing regulated financial services in the UAE therefore require a Central Bank licence or a recognised exemption depending on the precise activity and location. The law also establishes the Central Bank's mandate to operate or oversee payment and settlement systems.",
  },
  {
    title: "Payment Token Service Framework (proposed guidelines)",
    publisher: "Central Bank of the UAE",
    jurisdiction: "uae",
    documentType: "guidance",
    publicationDate: "2019",
    sourceUrl: "https://www.centralbank.ae",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The Central Bank of the UAE published proposed guidance for a Payment Token Service Framework covering providers of payment token services in the UAE. The framework contemplated licensing requirements for entities offering services such as issuing, exchanging, storing, and transferring payment tokens, and proposed that payment token service providers be subject to supervisory oversight, qualifying as licensed financial institutions with appropriate governance, capital, and operational requirements. Providers are expected to apply anti-money laundering and counter-terrorism financing controls, maintain customer identification, and address client safeguarding and redemption. Several categories of service were contemplated so the regime could scale with the market, and the guidance stressed that payment tokens may not be used in connection with unlawful activity.",
  },
  {
    title: "Stored Value Facilities Regulation",
    publisher: "Central Bank of the UAE",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2016",
    sourceUrl: "https://www.centralbank.ae",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The Stored Value Facilities (SVF) Regulation governs the issuance of e-money and stored value in the UAE. An entity must be licensed by the Central Bank to issue stored value facilities, and the regulation defines categories of facility with different limits and obligations. Issuers must maintain customer funds in a segregated, safeguarded manner, honour redemption of stored value on demand, and comply with anti-money laundering and customer due diligence requirements. The regulation is relevant to fintech companies offering electronic wallets, prepaid instruments, and similar payment products, and it complements the licensing framework for financial institutions conducting payment services in the UAE.",
  },
  {
    title: "SCA regulations on crypto asset trading",
    publisher: "Securities and Commodities Authority",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2020",
    sourceUrl: "https://www.sca.gov.ae",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The Securities and Commodities Authority issued regulations addressing crypto assets and token offerings in the markets it supervises. The regulations establish a licensing and supervisory framework for persons offering, promoting, or providing services in respect of crypto assets, including trading platforms and token issuers, and impose disclosure and investor-protection obligations. Issuers are expected to provide accurate information to investors, and platforms operating under SCA supervision must implement custody, governance, and anti-money-laundering controls. The scope interacts with the federal framework for virtual asset service providers and with free-zone regulatory regimes in Abu Dhabi and Dubai, so the applicable authority depends on the exact activity and venue.",
  },
  {
    title: "Law No. 4 of 2022 establishing the Virtual Assets Regulatory Authority",
    publisher: "Government of Dubai",
    jurisdiction: "uae",
    documentType: "legislation",
    publicationDate: "2022",
    sourceUrl: "https://www.vara.ae",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "Law No. 4 of 2022 established the Virtual Assets Regulatory Authority (VARA) in the Emirate of Dubai and regulates virtual asset service providers. The Law requires persons carrying on virtual asset activities in Dubai to hold the appropriate licence from VARA, and it defines a range of licensable virtual asset services including advisory services, brokerage and dealing, custody, exchange services, fund management, token issuance, and lending and borrowing activities. VARA is empowered to license, supervise, and enforce the virtual asset regime in the Emirate outside of the Dubai International Financial Centre. The framework is designed to align with international anti-money-laundering standards, and non-compliance can attract penalties. Entities operating within DIFC remain subject to the DIFC regime rather than VARA.",
  },
  {
    title: "UAE Cabinet Resolution No. 111 of 2022 on virtual asset service providers",
    publisher: "UAE Cabinet",
    jurisdiction: "uae",
    documentType: "resolution",
    publicationDate: "2022",
    sourceUrl: "https://u.ae/en",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The UAE Cabinet adopted a resolution addressing the regulation of virtual assets and the providers of virtual asset services at the federal level. The Resolution is part of efforts to align the national framework on virtual assets with the recommendations of the FATF by clarifying the respective roles of federal authorities. The Securities and Commodities Authority is designated as the authority responsible for the licensing and supervision of virtual asset service providers, in coordination with other competent authorities. Providers of virtual asset services are subject to anti-money-laundering and counter-terrorism-financing obligations, including customer due diligence and reporting of suspicious transactions, and must hold an appropriate licence. The federal regime operates alongside the free-zone regimes in Abu Dhabi and Dubai, which have their own licensing frameworks.",
  },
  {
    title:
      "Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data",
    publisher: "Government of the United Arab Emirates",
    jurisdiction: "uae",
    documentType: "legislation",
    publicationDate: "2021",
    sourceUrl: "https://u.ae/en",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "Federal Decree-Law No. 45 of 2021 is the UAE's first comprehensive federal data protection law. It applies to controllers and processors processing personal data in the UAE, with specific exemptions that include certain health data, banking and financial data regulated by the Central Bank, government-held data, and data within free zones that have their own data protection legislation, such as the DIFC. The law establishes lawful bases for processing, requiring consent or another recognised legal basis, grants data subjects rights such as access, correction, and erasure, and obliges controllers to implement appropriate technical and organisational safeguards. Controllers must notify both the relevant authority and affected individuals of personal data breaches that could harm data subjects. Transfer of personal data outside the UAE is subject to restrictions, and non-compliance can attract administrative penalties. Fintech firms operating in the UAE should map their data flows against this law together with any applicable sectoral or free-zone regime.",
  },
  {
    title:
      "Federal Decree-Law No. 20 of 2018 on Anti-Money Laundering and Combating Financing of Terrorism and Illegal Organisations (as amended)",
    publisher: "Government of the United Arab Emirates",
    jurisdiction: "uae",
    documentType: "legislation",
    publicationDate: "2018",
    lastUpdated: "2021",
    sourceUrl: "https://u.ae/en",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The UAE's primary anti-money-laundering and counter-terrorist-financing law is Federal Decree-Law No. 20 of 2018, as amended by Decree-Law No. 26 of 2021. It applies to financial institutions and designated non-financial businesses and professions in the UAE. Covered entities must apply customer due diligence, identify and verify beneficial owners, maintain records, and report suspicious transactions to the financial intelligence unit, which operates the goAML electronic reporting system. Firms are expected to implement internal policies, procedures, and controls proportionate to their money-laundering and terrorist-financing risk, and to provide training to staff. Penalties for non-compliance include financial sanctions and can extend to business restrictions. Virtual asset service providers and other fintech businesses are captured by the scope of the amended law, requiring them to design compliance programmes that meet the national AML/CFT standards.",
  },
  {
    title:
      "ADGM Financial Services and Markets Regulations (FSMR) and FSRA licensing",
    publisher: "Abu Dhabi Global Market",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2018",
    sourceUrl: "https://www.adgm.com",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The Abu Dhabi Global Market (ADGM) is an international financial centre established as a financial free zone in Abu Dhabi with its own legal system based on English common law. Financial services activities carried on in or from ADGM are regulated by the Financial Services Regulatory Authority (FSRA) under the Financial Services and Markets Regulations. Persons must obtain a licence from the FSRA to carry on financial services activity in ADGM, and licence applicants are assessed against fitness and propriety, governance, and capital requirements. ADGM operates a regulatory laboratory and sandbox that allows early-stage fintech firms to test innovative products under supervision. ADGM also provides a framework for regulated virtual asset activities within its jurisdiction. Firms choosing ADGM as an operating venue should confirm whether their intended activities fall within the FSRA's regulated-activity definitions.",
  },
  {
    title:
      "DIFC Regulatory Law 2004 and DFSA licensing framework",
    publisher: "Dubai Financial Services Authority",
    jurisdiction: "uae",
    documentType: "legislation",
    publicationDate: "2004",
    sourceUrl: "https://www.dfsa.ae",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "The Dubai International Financial Centre (DIFC) is a common-law financial free zone in Dubai with an independent legal and regulatory framework built on the Regulatory Law 2004. The Dubai Financial Services Authority (DFSA) licenses and supervises firms that carry on financial services in or from the DIFC, and no entity may conduct such activities without a DFSA licence. The DFSA regulates a wide range of financial services and also operates an Innovation Testing Licence that allows fintech firms to test new products in a restricted environment. Financial services and data protection within the DIFC are governed by the centre's own laws, including a dedicated data protection law, rather than the federal framework. Firms combining operations inside and outside the DIFC are typically subject to multiple regimes, so the structure of the entity determines which licences and obligations apply.",
  },
  {
    title:
      "Federal Law No. 32 of 2021 on Commercial Companies",
    publisher: "Government of the United Arab Emirates",
    jurisdiction: "uae",
    documentType: "legislation",
    publicationDate: "2021",
    sourceUrl: "https://u.ae/en",
    fixture: true,
    devNote: DEV_NOTE,
    content:
      "Federal Law No. 32 of 2021 on Commercial Companies governs company formation and corporate governance in the UAE outside financial free zones. It sets out the types of corporate vehicle available to founders, including limited liability companies, and prescribes governance duties for managers, auditors, and general assemblies. An entity is formed through the relevant commercial licensing authority in the emirate where it will operate, and the legal structure chosen must match the business activities being carried on. Financial activity in the UAE generally requires both a trade licence from the relevant licensing authority and any sector-specific regulatory licence from the competent regulator. The law is relevant to fintech founders structuring a UAE entity, alongside the applicable free-zone regime in ADGM or the DIFC where the company is based in a financial centre.",
  },
];