import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-20 text-[var(--text-main)]">
      <h1 className="text-4xl font-black">Terms of Service</h1>
      <p className="mt-6 text-[var(--text-muted)]">
        KEIBO staging access is for evaluation only. A campaign listing, payment
        intent, wallet connection, or investment receipt is not a promise of
        returns, regulatory eligibility, provider settlement, or blockchain
        finality.
      </p>
      <p className="mt-4 text-[var(--text-muted)]">
        Users must provide accurate information, use wallets they control, and
        comply with the eligibility and campaign rules shown before an action.
        Production terms and governing-entity details must be approved before
        public launch.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block font-bold text-[var(--primary)]"
      >
        Return home
      </Link>
    </main>
  );
}
