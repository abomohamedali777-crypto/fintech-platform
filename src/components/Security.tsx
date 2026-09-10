import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Server,
  FileCheck,
  Radar,
} from "lucide-react";

const pillars = [
  {
    icon: Lock,
    title: "TLS 1.3 in Transit",
    desc: "Perfect forward secrecy on every request, enforced certificate pinning, and certificate-only client auth.",
  },
  {
    icon: Server,
    title: "AES-256 at Rest",
    desc: "Field-level encryption with customer-managed keys and envelope encryption across all data stores.",
  },
  {
    icon: Fingerprint,
    title: "HSM Key Custody",
    desc: "Cryptographic keys isolated in hardware security modules, compliant with ISO/IEC 27001 and SOC 2 Type II.",
  },
  {
    icon: Radar,
    title: "Anomaly Detection",
    desc: "Real-time behavioral monitoring flags unusual access patterns and initiates automated response playbooks.",
  },
  {
    icon: FileCheck,
    title: "Audit-Ready Evidence",
    desc: "Immutable, tamper-evident logs with exportable evidence for external auditors and regulators.",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted Secrets Vault",
    desc: "API secrets rotated automatically; zero-trust access with scoped, short-lived credentials.",
  },
];

export default function Security() {
  return (
    <section id="security" className="scroll-mt-20 bg-canvas py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border hairline bg-white px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            Enterprise Security
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            Security is the product requirement
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate">
            Every layer of the infrastructure — transport, storage, custody, and
            telemetry — is engineered against a hardened control framework.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group rounded-2xl border hairline bg-white p-7 shadow-micro transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist transition-colors duration-300 ease-out group-hover:bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                    {p.title}
                  </h3>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-slate">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-6 rounded-2xl border hairline bg-mist/50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {[
              ["ISO/IEC 27001", "Certified"],
              ["SOC 2", "Type II"],
              ["GDPR", "SCC Based"],
              ["PCI DSS", "Merchant Scope"],
            ].map(([name, scope]) => (
              <div key={name}>
                <p className="text-[14px] font-semibold tracking-tight text-ink">{name}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate">{scope}</p>
              </div>
            ))}
          </div>
          <a
            href="#access"
            className="shrink-0 rounded-full bg-ink px-6 py-3 text-center text-[13px] font-semibold text-white transition-all duration-300 ease-out hover:bg-accent"
          >
            Download Compliance Report
          </a>
        </div>
      </div>
    </section>
  );
}