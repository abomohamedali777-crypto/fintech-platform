import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="rounded-md border border-slate-800 bg-mist px-4 py-1.5 text-[12px] font-medium tracking-tight text-accent">
        404
      </span>
      <h1 className="mt-6 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate">
        We could not find the page you are looking for. It may have moved, or the
        link may be out of date.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-md bg-accent px-7 py-3.5 text-[14px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:brightness-110"
      >
        Back to home
      </Link>
    </main>
  );
}