import type { Gym, Member } from "../../../generated/prisma/client.ts";
import { pendingPeriod, today } from "../../shared/utils/dates.ts";

/**
 * The reminder message sent to gym members.
 *
 * Two things are worth knowing about the language here:
 *
 * - This copy is read by gym *members*, not the owner, so its language follows
 *   `gym.messageLanguage` rather than whatever the owner set their interface to.
 *   An owner may well read the app in English while their members are better
 *   served in Hinglish.
 * - It is deliberately not in the next-intl bundles. Those ship to the browser
 *   and are chosen per device; this text is produced on the server so Phase 1's
 *   cron sends exactly the same wording as the manual flow
 *   (docs/api-contract.md §4.4).
 *
 * Phase 1 will move this into a per-gym MessageTemplate table
 * (docs/schema.md §7); a module-level function is enough while it is fixed.
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

interface Copy {
  /** Several months behind: names the span and the total. */
  arrears(name: string, gym: string, months: number, span: string, total: string | null): string;
  /** One period behind. */
  overdue(name: string, gym: string, amount: string, date: string): string;
  /** Not yet late. */
  upcoming(name: string, gym: string, amount: string, date: string): string;
}

const COPY: Record<Gym["messageLanguage"], Copy> = {
  HI_LATN: {
    arrears: (name, gym, months, span, total) =>
      `Namaste ${name}, ${gym} ki membership fees ${months} mahine se pending hai ` +
      `(${span})${total === null ? "" : ` - kul ${total}`}. ` +
      `Kripya jaldi jama karein. Dhanyavaad!`,
    overdue: (name, gym, amount, date) =>
      `Namaste ${name}, ${gym} ki membership fees${amount} ${date} ko due thi aur ` +
      `abhi tak pending hai. Kripya jaldi jama karein. Dhanyavaad!`,
    upcoming: (name, gym, amount, date) =>
      `Namaste ${name}, ${gym} ki membership fees${amount} ${date} ko due hai. ` +
      `Kripya time pe jama karein. Dhanyavaad!`,
  },

  EN: {
    arrears: (name, gym, months, span, total) =>
      `Hello ${name}, your ${gym} membership fees have been pending for ` +
      `${months} months (${span})${total === null ? "" : ` - ${total} in total`}. ` +
      `Please pay at your earliest. Thank you!`,
    overdue: (name, gym, amount, date) =>
      `Hello ${name}, your ${gym} membership fees${amount} were due on ${date} ` +
      `and are still pending. Please pay at your earliest. Thank you!`,
    upcoming: (name, gym, amount, date) =>
      `Hello ${name}, your ${gym} membership fees${amount} are due on ${date}. ` +
      `Please pay on time. Thank you!`,
  },
};

export function buildReminderMessage(
  member: Member,
  gym: Gym,
  dueDate: Date,
  now: Date = today(),
): string {
  const copy = COPY[gym.messageLanguage];
  const fee = member.feeAmount === null ? null : Number(member.feeAmount);
  const pending = pendingPeriod(dueDate, now);

  // Someone several months behind owes several months. Naming one month's fee
  // and one due date understated the debt and gave the member no idea which
  // period was outstanding.
  if (pending && pending.months > 1) {
    const total = fee === null ? null : formatAmount(fee * pending.months);
    const span =
      gym.messageLanguage === "EN"
        ? `${formatDate(pending.from)} to ${formatDate(pending.to)}`
        : `${formatDate(pending.from)} se ${formatDate(pending.to)} tak`;

    return copy.arrears(member.name, gym.name, pending.months, span, total);
  }

  const amountPart = fee === null ? "" : ` ${formatAmount(fee)}`;
  const date = formatDate(dueDate);

  return pending
    ? copy.overdue(member.name, gym.name, amountPart, date)
    : copy.upcoming(member.name, gym.name, amountPart, date);
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
