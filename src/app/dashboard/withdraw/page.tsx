"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { apiClient, financialErrorMessage } from "@/lib/api-client";
import {
  createPayoutDestination,
  disablePayoutDestination,
  getPayoutDestinations,
  getPayouts,
  requestPayout,
  type Payout,
  type PayoutDestination,
} from "@/lib/financial-service";

type Milestone = {
  _id?: string;
  id?: string;
  title: string;
  payoutPercentage?: number;
};
type ProjectResponse = {
  project?: { type?: string; projectType?: string };
  milestones?: Milestone[];
};
type Release = { id: string };

export default function WithdrawPage() {
  const query = useSearchParams();
  const projectId = query.get("projectId") || "";
  const [project, setProject] = useState<ProjectResponse>();
  const [destinations, setDestinations] = useState<PayoutDestination[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [milestoneId, setMilestoneId] = useState("");
  const [release, setRelease] = useState<Release>();
  const [destinationId, setDestinationId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: "mobile_money" as "bank" | "mobile_money",
    accountNumber: "",
    bankOrNetwork: "MTN",
    accountName: "",
  });
  const releaseKey = useRef("");
  const payoutKey = useRef("");
  const refresh = useCallback(async () => {
    const [nextDestinations, nextPayouts] = await Promise.all([
      getPayoutDestinations(),
      getPayouts(),
    ]);
    setDestinations(nextDestinations);
    setPayouts(nextPayouts);
  }, []);
  useEffect(() => {
    if (!projectId) {
      setError("Choose a charity campaign before releasing milestone funds.");
      setLoading(false);
      return;
    }
    void Promise.all([
      apiClient.get<ProjectResponse>(`/projects/${projectId}`),
      refresh(),
    ])
      .then(([response]) => setProject(response.data))
      .catch((caught) =>
        setError(
          financialErrorMessage(caught, "Could not load this campaign."),
        ),
      )
      .finally(() => setLoading(false));
  }, [projectId, refresh]);
  const run = async (action: () => Promise<void>) => {
    try {
      setBusy(true);
      setError("");
      await action();
    } catch (caught) {
      setError(
        financialErrorMessage(caught, "The request could not be completed."),
      );
    } finally {
      setBusy(false);
    }
  };
  const releaseFunds = () =>
    run(async () => {
      if (!milestoneId) throw new Error("Select a milestone.");
      releaseKey.current ||= crypto.randomUUID();
      const response = await apiClient.post<Release>(
        "/wallet/withdraw",
        { projectId, milestoneId },
        { headers: { "Idempotency-Key": releaseKey.current } },
      );
      setRelease(response.data);
      setMessage(
        "Funds released to your KEIBO payable balance. External payout is a separate step.",
      );
      await refresh();
    });
  const addDestination = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const destination = await createPayoutDestination({
        ...form,
        idempotencyKey: crypto.randomUUID(),
      });
      setDestinationId(destination.id);
      setForm({
        type: "mobile_money",
        accountNumber: "",
        bankOrNetwork: "MTN",
        accountName: "",
      });
      await refresh();
    });
  };
  const request = () =>
    run(async () => {
      if (!release || !destinationId)
        throw new Error(
          "Release funds and select a verified destination first.",
        );
      payoutKey.current ||= crypto.randomUUID();
      const payout = await requestPayout(
        release.id,
        destinationId,
        payoutKey.current,
      );
      setMessage(
        `Payout requested / Processing. Reference: ${payout.keiboReference ?? payout.keibo_reference ?? payout.id}`,
      );
      await refresh();
    });
  if (loading)
    return (
      <div className="min-h-screen bg-[var(--background)] pt-24">
        <Navbar />
        <main className="py-24 text-center">
          <Loader2 className="mx-auto animate-spin" />
        </main>
        <Footer />
      </div>
    );
  const isCharity =
    (project?.project?.type ??
      project?.project?.projectType ??
      query.get("type")) === "CHARITY";
  return (
    <div className="min-h-screen bg-[var(--background)] pt-24">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-7 px-6 py-14">
        <header>
          <h1 className="text-3xl font-black">Creator funds</h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Milestone release is internal accounting. Provider payout is a
            separate request.
          </p>
        </header>
        {isCharity ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="font-bold">Release milestone funds</h2>
            <div className="mt-4 flex gap-3">
              <select
                value={milestoneId}
                onChange={(event) => {
                  setMilestoneId(event.target.value);
                  releaseKey.current = "";
                }}
                className="min-w-0 flex-1 rounded-xl border p-3"
              >
                <option value="">Select milestone</option>
                {(project?.milestones ?? []).map((milestone) => (
                  <option
                    key={milestone.id ?? milestone._id}
                    value={milestone.id ?? milestone._id}
                  >
                    {milestone.title}
                    {milestone.payoutPercentage
                      ? ` (${milestone.payoutPercentage}%)`
                      : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void releaseFunds()}
                disabled={busy || !milestoneId}
                className="rounded-xl bg-[var(--primary)] px-4 font-bold text-white disabled:opacity-50"
              >
                Release milestone funds
              </button>
            </div>
            {release && (
              <p className="mt-4 text-sm text-emerald-700">
                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                Funds released to your KEIBO payable balance. External payout is
                a separate step.
              </p>
            )}
          </section>
        ) : (
          <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
            Only approved charity campaign milestones can be released here.
          </p>
        )}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-bold">Verified payout destinations</h2>
          <form
            onSubmit={addDestination}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <select
              value={form.type}
              onChange={(event) =>
                setForm({
                  ...form,
                  type: event.target.value as "bank" | "mobile_money",
                  bankOrNetwork: event.target.value === "bank" ? "" : "MTN",
                })
              }
              className="rounded-xl border p-3"
            >
              <option value="mobile_money">Mobile money</option>
              <option value="bank">Bank</option>
            </select>
            <input
              required
              value={form.bankOrNetwork}
              onChange={(event) =>
                setForm({ ...form, bankOrNetwork: event.target.value })
              }
              placeholder={form.type === "bank" ? "Bank code" : "MTN or Airtel"}
              className="rounded-xl border p-3"
            />
            <input
              required
              value={form.accountNumber}
              onChange={(event) =>
                setForm({ ...form, accountNumber: event.target.value })
              }
              placeholder="Account or mobile number"
              className="rounded-xl border p-3"
            />
            <input
              value={form.accountName}
              onChange={(event) =>
                setForm({ ...form, accountName: event.target.value })
              }
              placeholder="Account name (optional)"
              className="rounded-xl border p-3"
            />
            <button
              disabled={busy}
              className="rounded-xl border border-[var(--primary)] p-3 font-bold text-[var(--primary)]"
            >
              Add destination
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="flex gap-3 rounded-xl border p-3"
              >
                <input
                  type="radio"
                  checked={destinationId === destination.id}
                  disabled={destination.status !== "verified"}
                  onChange={() => setDestinationId(destination.id)}
                />
                <span className="flex-1">
                  {destination.maskedDisplay ?? destination.masked_display} ·{" "}
                  {destination.currency} · {destination.status}
                </span>
                {destination.status === "verified" && (
                  <button
                    type="button"
                    onClick={() =>
                      void run(async () => {
                        await disablePayoutDestination(destination.id);
                        await refresh();
                      })
                    }
                    className="text-sm text-red-600"
                  >
                    Disable
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-bold">External payout</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            The backend derives the release amount and currency; they cannot be
            edited here.
          </p>
          <button
            onClick={() => void request()}
            disabled={busy || !release || !destinationId}
            className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-3 font-bold text-white disabled:opacity-50"
          >
            Request payout
          </button>
          <button
            onClick={() => void run(refresh)}
            className="ml-3 text-sm font-bold text-[var(--primary)]"
          >
            <RefreshCw className="mr-1 inline h-4 w-4" />
            Refresh status
          </button>
          <div className="mt-4 space-y-2">
            {payouts.map((payout) => (
              <div key={payout.id} className="rounded-xl border p-3 text-sm">
                <b>{payout.state.toUpperCase()}</b> ·{" "}
                {payout.amountMinor ?? payout.amount_minor} {payout.currency} ·{" "}
                {payout.maskedDisplay ?? payout.masked_display} ·{" "}
                {payout.keiboReference ?? payout.keibo_reference}
              </div>
            ))}
          </div>
        </section>
        {message && (
          <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
