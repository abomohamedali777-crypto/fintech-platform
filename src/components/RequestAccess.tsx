"use client";

import { useState } from "react";
import { Check, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function RequestAccess() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section id="access" className="scroll-mt-20 bg-ink py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Request production access
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
            Approved enterprises begin with a sandbox credential within hours.
            Full production onboarding includes dedicated treasury engineers.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-white/70" strokeWidth={2.5} />
              Sandbox API key in under 24 hours
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-white/70" strokeWidth={2.5} />
              No setup fees
            </span>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          {submitted ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center animate-modal-in">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                Request received
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                A treasury engineer will contact <span className="font-medium text-white">{email}</span>{" "}
                within one business day to complete entitlement review and issue
                sandbox credentials.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enterprise email address"
                className="w-full flex-1 rounded-xl border border-white/10 bg-white px-5 py-3.5 text-[14px] font-medium text-ink placeholder:text-slate focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[14px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110"
              >
                Request Access
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </form>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/40">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            Transmission encrypted with TLS 1.3 · Reviewed under SOC 2 Type II controls
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-[12px] font-medium text-white/40">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
            By submitting, you agree to our terms of service and privacy policy.
          </div>
        </div>
      </div>
    </section>
  );
}