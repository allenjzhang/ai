/**
 * Parsed calendar invite (from .ics / iCalendar) for creating a ToDo task.
 */
export interface CalendarInvite {
  /** Event title (SUMMARY). */
  title: string;
  /** Event description/body (DESCRIPTION). */
  body: string;
  /** Start date/time (DTSTART) – used as due date for ToDo. */
  start: Date;
  /** End date/time (DTEND). */
  end?: Date;
  /** iCalendar RRULE string if recurring (e.g. "FREQ=WEEKLY;INTERVAL=1"). */
  rrule?: string;
  /** Time zone for start/end if known. */
  timeZone?: string;
}
