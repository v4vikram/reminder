import type { Gym, Member } from "../../../generated/prisma/client.ts";
import { pendingPeriod, today } from "../../shared/utils/dates.ts";

/**
 * The reminder message sent to gym members.
 *
 * Note the language split: code and API errors are English (developer-facing),
 * but this string is read by gym members in India, so it is Hinglish. It is the
 * product's user-facing copy, not developer output.
 *
 * The template lives on the server, not in the client, so changing the wording
 * is one deploy that affects every caller - and so Phase 1's cron reuses exactly
 * the same text as the manual flow. See docs/api-contract.md §4.4.
 *
 * Phase 1 will move this into a per-gym MessageTemplate table
 * (docs/schema.md §7); a module-level constant is enough while it is fixed.
 */

function formatAmount(amount: number): string {
  return `Rs.${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildReminderMessage(
  member: Member,
  gym: Gym,
  dueDate: Date,
  now: Date = today(),
): string {
  const fee = member.feeAmount === null ? null : Number(member.feeAmount);
  const pending = pendingPeriod(dueDate, now);

  // Someone several months behind owes several months. Naming one month's fee
  // and one due date understated the debt and gave the member no idea which
  // period was outstanding.
  if (pending && pending.months > 1) {
    const total = fee === null ? null : fee * pending.months;
    const span = `${formatDate(pending.from)} se ${formatDate(pending.to)} tak`;

    return (
      `Namaste ${member.name}, ${gym.name} ki membership fees ` +
      `${pending.months} mahine se pending hai (${span})` +
      `${total === null ? "" : ` - kul ${formatAmount(total)}`}. ` +
      `Kripya jaldi jama karein. Dhanyavaad!`
    );
  }

  const amountPart = fee === null ? "" : ` ${formatAmount(fee)}`;

  if (pending) {
    return (
      `Namaste ${member.name}, ${gym.name} ki membership fees${amountPart} ` +
      `${formatDate(dueDate)} ko due thi aur abhi tak pending hai. ` +
      `Kripya jaldi jama karein. Dhanyavaad!`
    );
  }

  return (
    `Namaste ${member.name}, ${gym.name} ki membership fees${amountPart} ` +
    `${formatDate(dueDate)} ko due hai. Kripya time pe jama karein. Dhanyavaad!`
  );
}

/**
 * Builds a click-to-chat link that opens WhatsApp with the message pre-filled.
 *
 * This is the whole MVP delivery mechanism: the owner taps it and sends from
 * their own number, so there is no messaging cost and no Meta verification to
 * wait on. See docs/adr/007-manual-whatsapp-mvp.md.
 *
 * `member.phone` is already E.164 without '+', which is exactly what wa.me
 * expects - that is why phone numbers are normalised on input.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
