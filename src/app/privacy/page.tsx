import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-20 text-[var(--text-main)]">
      <h1 className="text-4xl font-black">Privacy Notice</h1>
      <p className="mt-6 text-[var(--text-muted)]">
        KEIBO processes account, campaign, payment-reference, wallet-address,
        KYC-status, security and audit information needed to operate the
        service. Private keys and seed phrases must never be submitted to KEIBO.
      </p>
      <p className="mt-4 text-[var(--text-muted)]">
        Provider credentials, raw KYC payloads and wallet signatures are
        excluded from application logs. Production retention periods, processors
        and data-controller contact details remain a launch approval
        requirement.
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
