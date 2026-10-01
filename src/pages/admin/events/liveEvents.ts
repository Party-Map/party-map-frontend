import type { OwnedEventListItem } from "@/api/types";
import { parseDate } from "@/lib/format";

/** Published events still running or to come (soonest first), and past ones (latest first). */
export function splitByNow(events: OwnedEventListItem[], now: Date) {
    const upcoming = events
        .filter((event) => parseDate(event.end) >= now)
        .toSorted((a, b) => a.start.localeCompare(b.start));
    const past = events
        .filter((event) => parseDate(event.end) < now)
        .toSorted((a, b) => b.start.localeCompare(a.start));
    return { upcoming, past };
}
