import Dashboard from "./Dashboard";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-canvas pb-24 pt-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-full -translate-x-1/2 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(0,102,204,0.06),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border hairline bg-white px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro animate-fade-in-up">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Aligned to ISO/IEC 27001 &amp; SOC 2 control frameworks
          </span>
          <h1
            className="mt-7 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl animate-fade-in-up delay-100"
          >
            Automated Liquidity &amp; Settlement Infrastructure for Global B2B
            Enterprises
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-slate animate-fade-in-up delay-200"
          >
            Institutional-grade API primitives for automated treasury, cross-border
            flows, and programmable compliance.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up delay-300">
            <a
              href="#access"
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-7 py-3.5 text-[14px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110 sm:w-auto"
            >
              Request Access
            </a>
            <a
              href="#product"
              className="inline-flex w-full items-center justify-center rounded-full border hairline bg-white px-7 py-3.5 text-[14px] font-semibold text-ink transition-all duration-300 ease-out hover:bg-mist sm:w-auto"
            >
              View Platform Capabilities
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl animate-fade-in-up delay-400">
          <Dashboard />
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12px] font-medium tracking-wide text-slate">
          <span>Trusted infrastructure for:</span>
          <span className="font-semibold text-ink">Global Treasury Teams</span>
          <span className="text-ink">·</span>
          <span className="font-semibold text-ink">FX Corridors</span>
          <span className="text-ink">·</span>
          <span className="font-semibold text-ink">Embedded Finance Platforms</span>
        </div>
      </div>
    </section>
  );
}