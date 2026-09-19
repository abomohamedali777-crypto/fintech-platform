"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";

const team = [
  { name: "Amira Al Mansouri", roleKey: "role.1" as const, initials: "AM" },
  { name: "Daniel Cho", roleKey: "role.2" as const, initials: "DC" },
  { name: "Sofia Lindqvist", roleKey: "role.3" as const, initials: "SL" },
  { name: "Ravi Nair", roleKey: "role.4" as const, initials: "RN" },
  { name: "Elena García", roleKey: "role.5" as const, initials: "EG" },
  { name: "Tariq Haddad", roleKey: "role.6" as const, initials: "TH" },
];

const tones = [
  ["#E8E8ED", "#1D1D1F"],
  ["#DEDEE5", "#1D1D1F"],
  ["#F0F0F4", "#1D1D1F"],
  ["#E2E2E8", "#1D1D1F"],
  ["#DADAE2", "#1D1D1F"],
  ["#ECECF1", "#1D1D1F"],
];

function avatarUri(initials: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="${bg}"/>
  <circle cx="200" cy="206" r="92" fill="none" stroke="${fg}" stroke-opacity="0.08" stroke-width="1"/>
  <text x="200" y="232" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="72" font-weight="600" fill="${fg}" text-anchor="middle">${initials}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Team() {
  const { t } = useSettings();
  return (
    <section id="team" className="scroll-mt-20 bg-mist py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro">
              <Users className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              {t("team.badge")}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {t("team.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 text-base leading-relaxed text-slate">
              {t("team.sub")}
            </p>
          </Reveal>
        </div>

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {team.map((member, i) => {
            const [bg, fg] = tones[i % tones.length];
            return (
              <motion.li key={member.name} variants={item} className="list-none">
                <div className="group relative overflow-hidden rounded-2xl border hairline bg-canvas shadow-micro transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUri(member.initials, bg, fg)}
                      alt={member.name}
                      className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="mb-1.5 block h-0.5 w-6 rounded-full bg-accent" />
                    <p className="text-[13px] font-semibold tracking-tight text-white">
                      {member.name}
                    </p>
                    <p className="text-[11px] font-medium text-white/70">
                      {t(member.roleKey)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3.5">
                    <p className="truncate text-[12px] font-semibold tracking-tight text-ink">
                      {member.name}
                    </p>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate/30 transition-colors duration-500 ease-out group-hover:bg-accent" />
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}