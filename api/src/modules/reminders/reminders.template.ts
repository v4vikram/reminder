import type { Gym, Member } from "../../../generated/prisma/client.ts";

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
export function buildReminderMessage(member: Member, gym: Gym, dueDate: Date): string {
  const amount = Number(member.feeAmount).toLocaleString("en-IN");
  const date = dueDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    `Namaste ${member.name}, ${gym.name} ki membership fees Rs.${amount} ` +
    `${date} ko due hai. Kripya time pe jama karein. Dhanyavaad!`
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
