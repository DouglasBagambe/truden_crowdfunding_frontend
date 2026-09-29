"use client";

import { useState } from "react";
import {
  authorizeReceipt,
  getReceipt,
  issueReceipt,
  type Receipt,
} from "@/lib/financial-service";
import { financialErrorMessage } from "@/lib/api-client";

export function ReceiptLifecycle({ settlementId }: { settlementId: string }) {
  const [receipt, setReceipt] = useState<Receipt>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const issue = async () => {
    try {
      setBusy(true);
      setError("");
      await authorizeReceipt(settlementId);
      setReceipt(await issueReceipt(settlementId));
    } catch (caught) {
      setError(
        financialErrorMessage(
          caught,
          "Receipt issuance could not be requested.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const refresh = async () => {
    try {
      setBusy(true);
      setReceipt(await getReceipt(settlementId));
    } catch (caught) {
      setError(
        financialErrorMessage(caught, "Receipt status is not available yet."),
      );
    } finally {
      setBusy(false);
    }
  };
  const hash = receipt?.txHash ?? receipt?.tx_hash;
  const explorer = process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER_URL?.trim();
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
      <p className="font-bold text-white">Investment receipt</p>
      <p className="mt-1 text-sm text-gray-300">
        KEIBO receipts are non-transferable. Eligibility, amount, policy, and
        signing remain server-controlled.
      </p>
      {receipt ? (
        <p className="mt-3 text-sm text-white">
          Status: <b>{receipt.state}</b>
          {hash && (
            <>
              {" "}
              ·{" "}
              {explorer ? (
                <a
                  className="underline"
                  href={`${explorer.replace(/\/$/, "")}/tx/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                </a>
              ) : (
                hash
              )}
            </>
          )}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void issue()}
          disabled={busy}
          className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? "Requesting…" : "Issue investment receipt"}
        </button>
      )}{" "}
      {receipt && !["ISSUED", "FAILED", "REVOKED"].includes(receipt.state) && (
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="ml-3 text-sm font-bold text-white underline"
        >
          Refresh status
        </button>
      )}
      {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}
