"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Building2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  getPayoutDestinations,
  getPayouts,
  type Payout,
  type PayoutDestination,
} from "@/lib/financial-service";

function amount(payout: Payout) {
  const raw = payout.amountMinor ?? payout.amount_minor ?? "0";
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function WalletView() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [destinations, setDestinations] = useState<PayoutDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextPayouts, nextDestinations] = await Promise.all([
        getPayouts(),
        getPayoutDestinations(),
      ]);
      setPayouts(nextPayouts);
      setDestinations(nextDestinations);
    } catch {
      setError(
        "Financial records could not be loaded right now. No legacy balance is shown.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(
    () =>
      payouts.reduce(
        (total, payout) => {
          const value = amount(payout);
          if (payout.state === "paid") total.paid += value;
          if (payout.state === "pending" || payout.state === "processing")
            total.inMotion += value;
          return total;
        },
        { paid: 0, inMotion: 0 },
      ),
    [payouts],
  );

  const currency = payouts[0]?.currency ?? destinations[0]?.currency ?? "UGX";

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Financial records</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Money & payouts
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Payout records are sourced from KEIBO&apos;s PostgreSQL financial
            ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="button_secondary gap-2"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary
          label="Paid out"
          value={money(summary.paid, currency)}
          hint="Provider confirmed"
        />
        <Summary
          label="In motion"
          value={money(summary.inMotion, currency)}
          hint="Pending or processing"
        />
        <Summary
          label="Destinations"
          value={String(destinations.length)}
          hint={`${destinations.filter((item) => item.status === "verified").length} verified`}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="card_base overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="font-semibold">Payout activity</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              A destination is only paid when its state is Paid.
            </p>
          </div>
          <ArrowDownToLine size={18} className="text-[var(--text-muted)]" />
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-12 animate-pulse rounded bg-[var(--secondary)]"
              />
            ))}
          </div>
        ) : payouts.length ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="text-[var(--text-muted)]">
                      {payout.createdAt || payout.created_at
                        ? new Intl.DateTimeFormat("en-UG", {
                            dateStyle: "medium",
                          }).format(
                            new Date(
                              payout.createdAt || payout.created_at || "",
                            ),
                          )
                        : "—"}
                    </td>
                    <td className="font-medium">
                      {payout.keiboReference ||
                        payout.keibo_reference ||
                        payout.id}
                    </td>
                    <td>
                      {payout.maskedDisplay ||
                        payout.masked_display ||
                        "Verified destination"}
                    </td>
                    <td>
                      <State state={payout.state} />
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {money(amount(payout), payout.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<Wallet size={21} />}
            title="No payouts yet"
            detail="When a campaign release is sent to a verified destination, its status and reference will appear here."
          />
        )}
      </div>

      <div className="card_base overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <Building2 size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="font-semibold">Payout destinations</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Only masked destination details are displayed.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="h-16 animate-pulse bg-[var(--secondary)] m-5 rounded" />
        ) : destinations.length ? (
          <ul className="divide-y divide-[var(--border)]">
            {destinations.map((destination) => (
              <li
                className="flex items-center justify-between gap-3 px-5 py-4"
                key={destination.id}
              >
                <div>
                  <p className="text-sm font-medium">
                    {destination.maskedDisplay ||
                      destination.masked_display ||
                      "Payout destination"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {destination.type ||
                      destination.destination_type ||
                      "Destination"}{" "}
                    · {destination.currency}
                  </p>
                </div>
                <State state={destination.status} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            icon={<Building2 size={21} />}
            title="No payout destinations"
            detail="Add a verified bank or mobile-money destination when a campaign release is eligible for payout."
          />
        )}
      </div>
    </section>
  );
}

function Summary({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card_base p-4">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}
function State({ state }: { state: string }) {
  const tone =
    state === "paid" || state === "verified"
      ? "chip-success"
      : state === "failed" || state === "disabled"
        ? "chip-danger"
        : "chip-warning";
  return (
    <span className={`chip-base ${tone} px-2 py-0.5 text-[10px] capitalize`}>
      {state}
    </span>
  );
}
function Empty({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--secondary)] text-[var(--text-muted)]">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--text-muted)]">
        {detail}
      </p>
    </div>
  );
}
