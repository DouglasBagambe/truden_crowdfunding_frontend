import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-20 text-[var(--text-main)]">
      <h1 className="text-4xl font-black">Support</h1>
      <p className="mt-6 text-[var(--text-muted)]">
        The production support channel has not yet been published. For staging
        issues, record the page, time, campaign ID and non-secret payment
        reference, then provide them to the authorized staging operator.
      </p>
      <p className="mt-4 text-[var(--text-muted)]">
        Never send passwords, access tokens, KYC documents, card data, private
        keys or seed phrases in a support request.
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
