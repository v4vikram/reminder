/**
 * Generic formatters, shared across features.
 *
 * Anything specific to one feature - what a due status is called, which badge
 * colour it gets - belongs in that feature's utils.ts instead.
 */

/** Indian numbering, e.g. 1,20,000 - the format gym owners actually read. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatRelativeDate(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(iso);
}

/** "919876543210" -> "+91 98765 43210" */
export function formatPhone(e164: string): string {
  if (e164.length === 12 && e164.startsWith("91")) {
    return `+91 ${e164.slice(2, 7)} ${e164.slice(7)}`;
  }
  return `+${e164}`;
}
