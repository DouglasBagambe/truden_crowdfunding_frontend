export type CampaignFund = {
  currency: string;
  awaitingSettlementMinor: string;
  transferableMinor: string;
  transferredMinor: string;
};

export function hasTransferableFunds(funds?: CampaignFund[]) {
  // An older API without this read model must still be checked by the server.
  return (
    funds === undefined ||
    funds.some((fund) => BigInt(fund.transferableMinor) > BigInt(0))
  );
}

export function CampaignFundsStatus({ funds }: { funds?: CampaignFund[] }) {
  if (!funds) return null;
  const format = (value: string, currency: string) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency })
      .formatToParts(
        BigInt(value) / (currency === "UGX" ? BigInt(1) : BigInt(100)),
      )
      .map((part) =>
        part.type === "fraction"
          ? (BigInt(value) % BigInt(100)).toString().padStart(2, "0")
          : part.value,
      )
      .join("");
  return (
    <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
      {!funds.length && <p>No paid campaign funds yet.</p>}
      {funds.map((fund) => (
        <div key={fund.currency}>
          <p>
            Confirmed, ready to transfer:{" "}
            {format(fund.transferableMinor, fund.currency)} before campaign fee.
          </p>
          {BigInt(fund.awaitingSettlementMinor) > BigInt(0) && (
            <p role="status">
              Payment confirmed; provider fee still being verified:{" "}
              {format(fund.awaitingSettlementMinor, fund.currency)}.
            </p>
          )}
          {BigInt(fund.transferredMinor) > BigInt(0) && (
            <p>
              Already transferred from campaign:{" "}
              {format(fund.transferredMinor, fund.currency)} before campaign
              fee. See Wallet and payout activity for its current location.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
