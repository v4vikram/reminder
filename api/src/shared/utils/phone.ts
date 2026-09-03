import { ApiError } from "./apiError.ts";

const DEFAULT_COUNTRY_CODE = "91";

/**
 * Normalises a phone number to E.164 without the leading '+', e.g. "919876543210".
 *
 * Normalisation happens here and only here, at the input boundary, so stored
 * numbers are always in one format and building a wa.me link never has to
 * re-derive it. See docs/schema.md §3.9.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) {
    throw ApiError.validation("Phone number is empty", [
      { field: "phone", message: "A phone number is required" },
    ]);
  }

  // Ten-digit local Indian number: prepend the country code.
  if (digits.length === 10) return DEFAULT_COUNTRY_CODE + digits;

  // Local number written with a leading zero, e.g. 09876543210.
  if (digits.length === 11 && digits.startsWith("0")) {
    return DEFAULT_COUNTRY_CODE + digits.slice(1);
  }

  // Already carries a country code.
  if (digits.length >= 11 && digits.length <= 15) return digits;

  throw ApiError.validation("Phone number is invalid", [
    {
      field: "phone",
      message: `Got ${digits.length} digits; expected a 10-digit local number or 11-15 digits with a country code`,
    },
  ]);
}

/** Formats for display: "919876543210" -> "+91 98765 43210". */
export function formatPhoneForDisplay(e164: string): string {
  if (e164.length === 12 && e164.startsWith("91")) {
    return `+91 ${e164.slice(2, 7)} ${e164.slice(7)}`;
  }
  return `+${e164}`;
}
