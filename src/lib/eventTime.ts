import { parseDate } from "./format";

export interface TimeSpan {
    start: string;
    end: string;
}

/** Events still running or to come (soonest first), and the ended ones (latest first). */
export function splitByNow<T extends TimeSpan>(events: T[], now: Date): { upcoming: T[]; past: T[] } {
    const upcoming = events
        .filter((event) => parseDate(event.end) >= now)
        .toSorted((a, b) => a.start.localeCompare(b.start));
    const past = events
        .filter((event) => parseDate(event.end) < now)
        .toSorted((a, b) => b.start.localeCompare(a.start));
    return { upcoming, past };
}
