"use client";

import { useEffect, useRef, useState } from "react";
import { useMyProjects } from "@/hooks/useProjects";
import { isCharityProject } from "@/lib/roi-access";
import { financialErrorMessage } from "@/lib/api-client";
import {
  createPayoutDestination,
  getCreatorWallet,
  getPayoutDestinations,
  transferCampaignToWallet,
  withdrawCreatorWallet,
  type CreatorWallet,
  type PayoutDestination,
} from "@/lib/financial-service";

function displayMinor(value: string, currency: string) {
  const digits =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat("en-UG", { style: "currency", currency }).format(
    Number(value) / 10 ** digits,
  );
}

export function CharityWalletActions({
  onChanged,
}: {
  onChanged: () => Promise<void>;
}) {
  const {
    data: projects,
    isLoading: campaignsLoading,
    isError: campaignsError,
    refetch: reloadCampaigns,
  } = useMyProjects();
  const campaigns = (Array.isArray(projects) ? projects : []).filter(
    isCharityProject,
  ) as { id?: string; _id?: string; name?: string; status?: string }[];
  const [wallet, setWallet] = useState<CreatorWallet>();
  const [destinations, setDestinations] = useState<PayoutDestination[]>([]);
  const [destinationId, setDestinationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState(false);
  const [showDestination, setShowDestination] = useState(false);
  const [form, setForm] = useState({
    type: "mobile_money" as "bank" | "mobile_money",
    bankOrNetwork: "MTN",
    accountNumber: "",
    accountName: "",
  });
  const inFlight = useRef(false);
  const transferKeys = useRef<Record<string, string>>({});
  const withdrawKeys = useRef<Record<string, string>>({});
  const load = async () => {
    setLoading(true);
    try {
      const [nextWallet, nextDestinations] = await Promise.all([
        getCreatorWallet(),
        getPayoutDestinations(),
      ]);
      setWallet(nextWallet);
      setDestinations(nextDestinations);
      setError("");
    } catch (caught) {
      setWallet(undefined);
      setError(
        financialErrorMessage(caught, "Wallet could not be loaded. Try again."),
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await load();
      await onChanged();
    } catch (caught) {
      setError(
        financialErrorMessage(
          caught,
          "The request could not be completed. Please retry.",
        ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const destination = destinations.find(
    (d) => d.id === destinationId && d.status === "verified",
  );
  const currency = destination?.currency || "UGX";
  const available =
    wallet?.balances?.find((b) => b.currency === currency)?.availableMinor ||
    "0";
  const transfer = (id: string) =>
    run(async () => {
      transferKeys.current[id] ||= crypto.randomUUID();
      await transferCampaignToWallet(id, transferKeys.current[id]);
      delete transferKeys.current[id];
      setMessage(
        "Settled campaign funds transferred to Wallet after the existing campaign fee. No bank or mobile-money payment was made.",
      );
    });
  const withdraw = () =>
    run(async () => {
      if (!destination) throw new Error("Select a verified destination.");
      withdrawKeys.current[destination.id] ||= crypto.randomUUID();
      const result = await withdrawCreatorWallet(
        destination.id,
        withdrawKeys.current[destination.id],
        available,
      );
      delete withdrawKeys.current[destination.id];
      setReview(false);
      setMessage(
        `Withdrawal requested. Funds are reserved while the provider processes it. Reference: ${result.keiboReference || result.id}`,
      );
    });
  return (
    <div className="space-y-5">
      <section
        className="card_base space-y-4 p-5"
        aria-label="Wallet withdrawal"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Available to withdraw</h3>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {loading
                ? "Loading..."
                : wallet
                  ? displayMinor(available, currency)
                  : "Unavailable"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Combined funds transferred from your campaigns. Withdraw all
              available funds in the selected destination currency.
            </p>
          </div>
          <button
            type="button"
            className="button_secondary"
            disabled={loading || busy}
            onClick={() => void load()}
          >
            Refresh wallet
          </button>
        </div>
        {wallet?.balances
          ?.filter((b) => b.currency !== currency)
          .map((b) => (
            <p key={b.currency} className="text-sm">
              {displayMinor(b.availableMinor, b.currency)} available in{" "}
              {b.currency}. A destination in the same currency is required.
            </p>
          ))}
        {wallet?.balances
          ?.filter((b) => BigInt(b.heldMinor) > BigInt(0))
          .map((b) => (
            <p key={b.currency} className="text-sm text-[var(--text-muted)]">
              {displayMinor(b.heldMinor, b.currency)} reserved for withdrawals.
              Failed transfers remain reserved for review to prevent duplicate
              payment.
            </p>
          ))}
        <label className="block space-y-2 text-sm font-semibold">
          Withdraw to
          <select
            className="input_field w-full"
            aria-label="Wallet payout destination"
            value={destinationId}
            disabled={busy}
            onChange={(e) => {
              setDestinationId(e.target.value);
              setReview(false);
            }}
          >
            <option value="">Choose bank or mobile money</option>
            {destinations
              .filter((d) => d.status === "verified")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.maskedDisplay || d.masked_display} · {d.currency}
                </option>
              ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="button_primary"
            disabled={
              loading ||
              busy ||
              !wallet ||
              !destination ||
              BigInt(available) <= BigInt(0)
            }
            onClick={() => setReview(true)}
          >
            Withdraw all
          </button>
          <button
            type="button"
            className="button_secondary"
            disabled={busy}
            onClick={() => setShowDestination(!showDestination)}
          >
            Add bank or mobile money
          </button>
        </div>
        {review && (
          <div
            role="dialog"
            aria-label="Confirm Wallet withdrawal"
            className="rounded-lg border border-[var(--border)] p-4 space-y-3"
          >
            <h4 className="font-bold">Confirm withdrawal</h4>
            <p>
              Send {displayMinor(available, currency)} to{" "}
              {destination?.maskedDisplay || destination?.masked_display}? This
              sends funds out of your KEIBO Wallet.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="button_primary"
                disabled={busy}
                onClick={() => void withdraw()}
              >
                Confirm withdrawal
              </button>
              <button
                type="button"
                className="button_secondary"
                disabled={busy}
                onClick={() => setReview(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {showDestination && (
          <form
            className="space-y-3 rounded-lg border border-[var(--border)] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const added = await createPayoutDestination({
                  ...form,
                  idempotencyKey: crypto.randomUUID(),
                });
                setDestinationId(added.id);
                setShowDestination(false);
                setForm({ ...form, accountNumber: "", accountName: "" });
                setMessage("Payout destination added.");
              });
            }}
          >
            <h4 className="font-semibold">Add payout destination</h4>
            <label className="block text-sm">
              Type
              <select
                aria-label="Destination type"
                className="input_field"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "bank" | "mobile_money",
                  })
                }
              >
                <option value="mobile_money">Mobile money</option>
                <option value="bank">Bank</option>
              </select>
            </label>
            <label className="block text-sm">
              Bank or network code
              <input
                required
                className="input_field"
                value={form.bankOrNetwork}
                onChange={(e) =>
                  setForm({ ...form, bankOrNetwork: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Account or mobile number
              <input
                required
                inputMode="numeric"
                className="input_field"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Account name
              <input
                className="input_field"
                value={form.accountName}
                onChange={(e) =>
                  setForm({ ...form, accountName: e.target.value })
                }
              />
            </label>
            <button type="submit" className="button_primary" disabled={busy}>
              Save destination
            </button>
          </form>
        )}
        <p className="text-xs text-[var(--text-muted)]">
          Withdrawal requires verified identity and creator approval. Pending
          donations cannot be transferred or withdrawn.
        </p>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-amber-300 p-4 text-sm"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300 p-4 text-sm"
        >
          {message}
        </p>
      )}
      <section
        aria-label="Transfer campaign funds to Wallet"
        className="card_base space-y-4 p-5"
      >
        <h3 className="text-lg font-semibold">Campaign funds</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Transfer settled campaign funds into Wallet first. This is internal
          only; it does not send money to your bank or mobile money. The
          existing campaign fee applies when funds transfer.
        </p>
        {campaignsLoading ? (
          <p>Loading campaigns...</p>
        ) : campaignsError ? (
          <div role="alert">
            Campaigns could not be loaded.{" "}
            <button type="button" onClick={() => void reloadCampaigns()}>
              Retry campaigns
            </button>
          </div>
        ) : campaigns.length ? (
          <ul className="divide-y divide-[var(--border)]">
            {campaigns.map((c) => {
              const id = c.id || c._id;
              if (!id) return null;
              return (
                <li
                  key={id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">
                      {c.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {c.status?.replaceAll("_", " ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Transfer ${c.name} to wallet`}
                    className="button_secondary shrink-0 px-3 py-1.5 text-xs"
                    disabled={busy || c.status !== "APPROVED"}
                    onClick={() => void transfer(id)}
                  >
                    Transfer to wallet
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Your charity campaigns will appear here.</p>
        )}
      </section>
    </div>
  );
}
