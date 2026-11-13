"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CharityWalletActions } from "./CharityWalletActions";
import { financialErrorMessage } from "@/lib/api-client";
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
  getPayoutProviderEvidence,
  type Payout,
  type PayoutDestination,
} from "@/lib/financial-service";

function amount(payout: Payout): bigint {
  const raw = payout.amountMinor ?? payout.amount_minor ?? "0";
  return /^\d+$/.test(raw) ? BigInt(raw) : BigInt(0);
}

// Fiat provider accounting uses whole shillings for UGX and cents otherwise.
function money(value: bigint, currency: string) {
  const digits = currency === "UGX" ? 0 : 2;
  const scale = BigInt(10) ** BigInt(digits);
  const formatter = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter
    .formatToParts(value / scale)
    .map((part) =>
      part.type === "fraction"
        ? (value % scale).toString().padStart(digits, "0")
        : part.value,
    )
    .join("");
}

export function WalletView() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [destinations, setDestinations] = useState<PayoutDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [checkingProvider, setCheckingProvider] = useState("");
  const [providerChecks, setProviderChecks] = useState<Record<string, string>>(
    {},
  );

  const checkProvider = async (id: string) => {
    if (checkingProvider) return;
    setCheckingProvider(id);
    try {
      const result = await getPayoutProviderEvidence(id);
      setProviderChecks((current) => ({ ...current, [id]: result.message }));
    } catch (caught) {
      setProviderChecks((current) => ({
        ...current,
        [id]: financialErrorMessage(
          caught,
          "Provider status could not be verified. No payment or balance change was made.",
        ),
      }));
    } finally {
      setCheckingProvider("");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextPayouts, nextDestinations] = await Promise.all([
        getPayouts(),
        getPayoutDestinations(),
      ]);
      setPayouts(nextPayouts);
      setDestinations(nextDestinations);
      setRefreshToken((token) => token + 1);
    } catch {
      setError(
        "Financial records could not be loaded right now. No legacy balance is shown.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasActivePayout = payouts.some(
    (p) =>
      (p.state === "pending" || p.state === "processing") &&
      p.processingStatus !== "review_required",
  );

  useEffect(() => {
    if (!hasActivePayout) return;
    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [hasActivePayout, load]);

  const summaries = useMemo(() => {
    const currencies = new Map<string, { paid: bigint; inMotion: bigint }>();
    for (const payout of payouts) {
      const total = currencies.get(payout.currency) ?? {
        paid: BigInt(0),
        inMotion: BigInt(0),
      };
      if (payout.state === "paid") total.paid += amount(payout);
      if (
        (payout.state === "pending" || payout.state === "processing") &&
        payout.processingStatus !== "review_required"
      )
        total.inMotion += amount(payout);
      currencies.set(payout.currency, total);
    }
    if (!currencies.size)
      currencies.set(destinations[0]?.currency ?? "UGX", {
        paid: BigInt(0),
        inMotion: BigInt(0),
      });
    return [...currencies.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [payouts, destinations]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Campaign funds</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Wallet</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage campaign withdrawals and track transfers to your bank or
            mobile money.
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

      {payouts.some((p) => p.processingStatus === "review_required") && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 p-4 text-sm"
        >
          A withdrawal has stopped and needs admin review. Funds remain reserved
          to prevent duplicate payment. See Payout activity below for the failed
          step and available error details. Do not submit a replacement for that
          withdrawal.
          {payouts
            .filter((p) => p.processingStatus === "review_required")
            .map((p) => (
              <div key={p.id} className="mt-3 break-words">
                <p className="font-semibold">
                  {money(amount(p), p.currency)} · Review required · not
                  confirmed paid
                </p>
                <p>
                  {p.errorMessage || "The provider outcome needs verification."}
                </p>
                <p>
                  Reference: {p.keiboReference || p.keibo_reference || p.id}
                </p>
                <button
                  type="button"
                  className="button_secondary mt-2"
                  disabled={Boolean(checkingProvider)}
                  onClick={() => void checkProvider(p.id)}
                >
                  {checkingProvider === p.id
                    ? "Checking provider…"
                    : "Check provider status"}
                </button>
                <p className="mt-1 text-xs">
                  Read-only. This does not retry or send a payment.
                </p>
                {providerChecks[p.id] && (
                  <p role="status" className="mt-2">
                    {providerChecks[p.id]}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}

      <CharityWalletActions onChanged={load} refreshToken={refreshToken} />

      <div className="grid gap-3 sm:grid-cols-3">
        {summaries.map(([currency, summary]) => (
          <div key={currency} className="contents">
            <Summary
              label={`Paid out · ${currency}`}
              value={money(summary.paid, currency)}
              hint="Provider confirmed"
            />
            <Summary
              label={`In motion · ${currency}`}
              value={money(summary.inMotion, currency)}
              hint="Pending or processing"
            />
          </div>
        ))}
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
                      <State state={payout.processingStatus || payout.state} />
                      {payout.errorMessage && (
                        <div className="mt-2 max-w-sm whitespace-normal text-xs text-[var(--text-muted)]">
                          <p>{payout.errorMessage}</p>
                          <p className="mt-1">
                            Step:{" "}
                            {payout.failureStage?.replaceAll("_", " ") ||
                              "payout processing"}{" "}
                            · Code: {payout.errorCode || "unknown"}
                          </p>
                          <p>
                            Funds remain reserved. Admin review is required
                            before any replacement payment.
                          </p>
                        </div>
                      )}
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
      : state === "failed" ||
          state === "disabled" ||
          state === "review_required"
        ? "chip-danger"
        : "chip-warning";
  return (
    <span className={`chip-base ${tone} px-2 py-0.5 text-[10px] capitalize`}>
      {state.replaceAll("_", " ")}
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
