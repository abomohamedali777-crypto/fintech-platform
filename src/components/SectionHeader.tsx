export default function SectionHeader({
  index,
  eyebrow,
  title,
  sub,
}: {
  index: string;
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="grid gap-5 border-t border-slate-800 pt-6 sm:gap-6 lg:grid-cols-12 lg:gap-10">
      <p className="font-mono text-[11px] uppercase tracking-tight text-accent lg:col-span-3">
        {index} <span aria-hidden className="text-slate">/</span> {eyebrow}
      </p>
      <h2 className="font-serif text-[2.1rem] leading-[1.08] font-medium tracking-tight text-ink sm:text-4xl md:text-[2.8rem] lg:col-span-5">
        {title}
      </h2>
      {sub && (
        <p className="max-w-md text-[15px] leading-relaxed text-slate lg:col-span-4 lg:col-start-9">
          {sub}
        </p>
      )}
    </div>
  );
}
