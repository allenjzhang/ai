/**
 * Extract calendar invites from emails (Outlook/Gmail .ics) and return parsed invites for ToDo creation.
 */
import type { EmailMessage } from "../types/email.js";
import type { CalendarInvite } from "../types/calendar.js";
import { parseIcsToCalendarInvite } from "../utils/ics.js";
import { fetchOutlookMessageIcs } from "./outlook.js";
import { fetchGmailMessageIcs } from "./gmail.js";
import type { MicrosoftAuthConfig } from "../auth/microsoft.js";
import type { GoogleAuthConfig } from "../auth/google.js";

const CALENDAR_SUBJECT_PATTERN = /invit|meeting|calendar|event|accepted|declined|tentative/i;

export interface CalendarInviteWithEmail {
  invite: CalendarInvite;
  emailId: string;
  subject: string;
}

/**
 * Heuristic: only consider emails that look like calendar/meeting related (reduces API calls).
 */
export function looksLikeCalendarEmail(email: EmailMessage): boolean {
  return CALENDAR_SUBJECT_PATTERN.test(email.subject);
}

/**
 * For each email that looks like a calendar invite, fetch .ics (Outlook or Gmail) and parse.
 * Returns list of parsed invites with email context. Skips emails that don’t yield a valid VEVENT.
 */
export async function getCalendarInvitesFromEmails(
  emails: EmailMessage[],
  options: {
    outlookAuth?: MicrosoftAuthConfig | null;
    gmailAuth?: GoogleAuthConfig | null;
  }
): Promise<CalendarInviteWithEmail[]> {
  const { outlookAuth, gmailAuth } = options;
  const results: CalendarInviteWithEmail[] = [];

  for (const email of emails) {
    if (!looksLikeCalendarEmail(email)) continue;

    let icsContent: string | null = null;
    try {
      if (email.source === "outlook" && outlookAuth) {
        icsContent = await fetchOutlookMessageIcs(email.id, { auth: outlookAuth });
      } else if (email.source === "gmail" && gmailAuth) {
        icsContent = await fetchGmailMessageIcs(email.id, { auth: gmailAuth });
      }
    } catch {
      // Skip this email on fetch error
      continue;
    }

    if (!icsContent) continue;

    const invite = parseIcsToCalendarInvite(icsContent);
    if (invite) {
      results.push({
        invite,
        emailId: email.id,
        subject: email.subject,
      });
    }
  }

  return results;
}
