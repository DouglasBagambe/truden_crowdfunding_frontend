import Link from "next/link";

export function FeatureUnavailable({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-24 text-[var(--text-main)]">
      <section className="mx-auto max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Keibo staging
        </p>
        <h1 className="mt-3 text-2xl font-black">
          {title} is not available yet
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          This area is feature-gated until its typed API and operational
          workflow are ready.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
