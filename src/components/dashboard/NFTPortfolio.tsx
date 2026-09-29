"use client";

import { TicketCheck } from "lucide-react";

/** Receipt issuance is initiated from a qualifying settled contribution. */
export function NFTPortfolio() {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <TicketCheck className="mx-auto h-12 w-12 text-[var(--primary)]" />
      <h2 className="mt-4 text-xl font-black text-[var(--text-main)]">
        Investment receipts
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        KEIBO receipts are issued only after backend settlement and eligibility
        checks. They are non-transferable and cannot be listed, sold, or bought
        on a marketplace.
      </p>
    </section>
  );
}
