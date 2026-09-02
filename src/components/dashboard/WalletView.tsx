"use client";

import { AlertTriangle, Wallet } from "lucide-react";

export function WalletView() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-amber-300/40 bg-amber-50/70 p-8 text-center dark:bg-amber-950/10">
      <Wallet className="mx-auto h-12 w-12 text-amber-600" />
      <h2 className="mt-5 text-2xl font-black text-[var(--text-main)]">
        Wallet temporarily unavailable
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Legacy wallet balances are not financial truth. Deposits, balance
        spending, and withdrawals remain disabled until the PostgreSQL ledger
        and provider payout adapters are configured and reconciled for this
        environment.
      </p>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-white/60 p-4 text-left text-sm text-amber-900 dark:bg-black/20 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          No balance or transaction shown here should be inferred from legacy
          Mongo records.
        </p>
      </div>
    </section>
  );
}
