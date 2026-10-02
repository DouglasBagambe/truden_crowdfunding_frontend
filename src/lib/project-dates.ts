const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDateInput(value: string): boolean {
  const match = DATE_INPUT_PATTERN.exec(value);
  if (!match) return false;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * A date-only campaign deadline remains stable in form state and is sent as
 * the final millisecond of that UTC date at the API boundary.
 */
export function campaignDeadlineToIso(value: string): string | undefined {
  if (!isValidDateInput(value)) return undefined;
  return `${value}T23:59:59.999Z`;
}

export function isFutureCampaignDeadline(
  value: string,
  now: Date = new Date(),
): boolean {
  const iso = campaignDeadlineToIso(value);
  return Boolean(iso && new Date(iso).getTime() > now.getTime());
}

export function formatCampaignDeadline(value: string): string | undefined {
  if (!isValidDateInput(value)) return undefined;
  const iso = campaignDeadlineToIso(value);
  if (!iso) return undefined;
  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(iso));
}
