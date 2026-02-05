/**
 * Map iCalendar RRULE to Microsoft Graph patternedRecurrence (best effort).
 */
const RRULE_DAY_MAP: Record<string, string> = {
  MO: "monday",
  TU: "tuesday",
  WE: "wednesday",
  TH: "thursday",
  FR: "friday",
  SA: "saturday",
  SU: "sunday",
};

function parseRrule(rrule: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of rrule.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) out[k.toUpperCase()] = v;
  }
  return out;
}

export interface GraphRecurrence {
  pattern: {
    type: "daily" | "weekly" | "absoluteMonthly" | "relativeMonthly" | "absoluteYearly" | "relativeYearly";
    interval: number;
    daysOfWeek?: string[];
    firstDayOfWeek?: string;
    dayOfMonth?: number;
    month?: number;
  };
  range: {
    type: "noEnd" | "endDate" | "numbered";
    startDate: string;
    endDate?: string;
    numberOfOccurrences?: number;
    recurrenceTimeZone?: string;
  };
}

/**
 * Convert RRULE string and start date to Graph patternedRecurrence. Returns null if not supported.
 */
export function rruleToGraphRecurrence(
  rrule: string,
  startDate: Date,
  timeZone: string = "UTC"
): GraphRecurrence | null {
  const params = parseRrule(rrule);
  const freq = params["FREQ"];
  if (!freq) return null;

  const interval = Math.max(1, parseInt(params["INTERVAL"] ?? "1", 10) || 1);
  const startDateStr = startDate.toISOString().slice(0, 10);

  let pattern: GraphRecurrence["pattern"];
  switch (freq) {
    case "DAILY":
      pattern = { type: "daily", interval };
      break;
    case "WEEKLY": {
      const byday = params["BYDAY"]?.split(",").map((d) => RRULE_DAY_MAP[d.trim()] ?? d.toLowerCase());
      pattern = {
        type: "weekly",
        interval,
        daysOfWeek: byday?.length ? byday : ["sunday"],
        firstDayOfWeek: "sunday",
      };
      break;
    }
    case "MONTHLY":
      pattern = {
        type: "absoluteMonthly",
        interval,
        dayOfMonth: startDate.getDate(),
      };
      break;
    case "YEARLY":
      pattern = {
        type: "absoluteYearly",
        interval,
        dayOfMonth: startDate.getDate(),
        month: startDate.getMonth() + 1,
      };
      break;
    default:
      return null;
  }

  let range: GraphRecurrence["range"];
  const count = params["COUNT"] ? parseInt(params["COUNT"], 10) : 0;
  const until = params["UNTIL"];
  if (count > 0) {
    range = {
      type: "numbered",
      startDate: startDateStr,
      numberOfOccurrences: count,
      recurrenceTimeZone: timeZone,
    };
  } else if (until) {
    const endDate = until.length === 8 ? `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}` : until.slice(0, 10);
    range = {
      type: "endDate",
      startDate: startDateStr,
      endDate,
      recurrenceTimeZone: timeZone,
    };
  } else {
    range = {
      type: "noEnd",
      startDate: startDateStr,
      recurrenceTimeZone: timeZone,
    };
  }

  return { pattern, range };
}
