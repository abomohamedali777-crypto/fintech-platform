import type { LegalSection } from "@/data/legal";

export default function LegalDocument({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 pt-36 pb-24">
      <p className="text-[12px] font-medium uppercase tracking-wider text-slate">
        Legal Documentation
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-slate">Last updated: {updatedAt}</p>

      <div className="mt-10 space-y-9 border-t hairline pt-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {section.heading}
            </h2>
            <div className="mt-2.5 space-y-2.5">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-slate">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}