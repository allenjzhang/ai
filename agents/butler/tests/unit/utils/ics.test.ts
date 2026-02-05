import { describe, it, expect } from "vitest";
import { parseIcsToCalendarInvite } from "../../../src/utils/ics.js";

describe("parseIcsToCalendarInvite", () => {
  it("parses a simple VEVENT", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20251215T140000Z",
      "DTEND:20251215T150000Z",
      "SUMMARY:Team standup",
      "DESCRIPTION:Weekly sync",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const invite = parseIcsToCalendarInvite(ics);
    expect(invite).not.toBeNull();
    expect(invite!.title).toBe("Team standup");
    expect(invite!.body).toBe("Weekly sync");
    expect(invite!.start.getUTCFullYear()).toBe(2025);
    expect(invite!.start.getUTCMonth()).toBe(11);
    expect(invite!.start.getUTCDate()).toBe(15);
  });

  it("returns null when no VEVENT", () => {
    expect(parseIcsToCalendarInvite("BEGIN:VCALENDAR\r\nEND:VCALENDAR")).toBeNull();
  });

  it("parses RRULE", () => {
    const ics = [
      "BEGIN:VEVENT",
      "DTSTART:20251215T140000Z",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE",
      "SUMMARY:Recurring meeting",
      "END:VEVENT",
    ].join("\r\n");
    const invite = parseIcsToCalendarInvite(ics);
    expect(invite?.rrule).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
  });
});
