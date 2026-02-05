/**
 * Simple iCalendar (.ics) parser for VEVENT (SUMMARY, DESCRIPTION, DTSTART, DTEND, RRULE).
 */
import type { CalendarInvite } from "../types/calendar.js";

function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseParamDate(value: string): { date: Date; tz?: string } {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(?:Z)?)?/);
  if (!match) return { date: new Date(0) };
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  return { date: new Date(iso) };
}

function parseLineValue(line: string): string {
  const i = line.indexOf(":");
  return i >= 0 ? line.slice(i + 1).trim() : "";
}

/**
 * Parse a single VEVENT from ics text. Returns the first VEVENT found.
 */
export function parseIcsToCalendarInvite(icsContent: string): CalendarInvite | null {
  const normalized = unfold(icsContent);
  const begin = normalized.indexOf("BEGIN:VEVENT");
  if (begin === -1) return null;
  const end = normalized.indexOf("END:VEVENT", begin);
  if (end === -1) return null;
  const block = normalized.slice(begin, end);
  const lines = block.split(/\r?\n/);

  let summary = "";
  let description = "";
  let dtstart = "";
  let dtend = "";
  let rrule = "";
  let tz = "UTC";

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith("SUMMARY")) summary = parseLineValue(line);
    else if (upper.startsWith("DESCRIPTION")) description = parseLineValue(line).replace(/\\n/g, "\n");
    else if (upper.startsWith("DTSTART")) {
      dtstart = parseLineValue(line);
      const tzMatch = line.match(/TZID=([^:;\s]+)/i);
      if (tzMatch) tz = tzMatch[1];
    } else if (upper.startsWith("DTEND")) dtend = parseLineValue(line);
    else if (upper.startsWith("RRULE")) rrule = parseLineValue(line);
  }

  if (!dtstart) return null;

  const { date: start } = parseParamDate(dtstart);
  const endDate = dtend ? parseParamDate(dtend).date : undefined;

  return {
    title: summary || "(No title)",
    body: description,
    start,
    end: endDate,
    rrule: rrule || undefined,
    timeZone: tz,
  };
}
