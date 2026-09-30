// Date formatting for the UI, on date-fns. The backend stores LocalDateTime without a zone and sends ISO strings
// such as "2025-12-20T20:00:00"; those parse as local time, which is what the UI wants.
import {
    clamp,
    differenceInCalendarDays,
    format,
    isAfter,
    isSameDay as sameDay,
    isSameYear,
    isValid,
    parseISO,
} from "date-fns";

export function parseDate(value: string | Date): Date {
    return value instanceof Date ? value : parseISO(value);
}

export function isValidDate(date: Date): boolean {
    return isValid(date);
}

export function isSameDay(a: Date, b: Date): boolean {
    return sameDay(a, b);
}

/** "HH:mm" in 24-hour time. */
export function formatTime(value: string | Date): string {
    return format(parseDate(value), "HH:mm");
}

/** Today / Tomorrow / Yesterday / weekday names within a week / DD/MM/YYYY otherwise. */
export function calendarDayLabel(value: string | Date, now: Date = new Date()): string {
    const date = parseDate(value);
    const dayDiff = differenceInCalendarDays(date, now);

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Tomorrow";
    if (dayDiff === -1) return "Yesterday";
    if (dayDiff > 1 && dayDiff < 7) return format(date, "EEEE");
    if (dayDiff < -1 && dayDiff > -7) return `Last ${format(date, "EEEE")}`;
    return format(date, "dd/MM/yyyy");
}

/**
 * Range for the UI, e.g. "Today • 14:00 – 16:00" or "Today 14:00 – Tomorrow 16:00".
 */
export function formatDateTimeRange(start: string | Date, end: string | Date, now: Date = new Date()): string {
    const s = parseDate(start);
    const e = parseDate(end);
    const startDay = calendarDayLabel(s, now);
    const endDay = calendarDayLabel(e, now);

    if (isSameDay(s, e)) {
        return `${startDay} • ${formatTime(s)} – ${formatTime(e)}`;
    }
    return `${startDay} ${formatTime(s)} – ${endDay} ${formatTime(e)}`;
}

/** "HH:mm" when today, otherwise "20 Dec" (with the year when it is not the current one). */
export function formatNextEventStart(value: string | null | undefined, now: Date = new Date()): string | null {
    if (!value) return null;
    const date = parseDate(value);
    if (!isValidDate(date)) return null;
    if (isSameDay(date, now)) return formatTime(date);
    return format(date, isSameYear(date, now) ? "d MMM" : "d MMM yyyy");
}

/** "YYYY-MM-DD HH:mm" for admin labels. */
export function formatDateTime(value: string | Date): string {
    return format(parseDate(value), "yyyy-MM-dd HH:mm");
}

/** Value for <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in local time, or "" when invalid. */
export function toDateTimeLocalInput(value: string | Date | null | undefined): string {
    if (!value) return "";
    const d = parseDate(value);
    if (!isValidDate(d)) return "";
    return format(d, "yyyy-MM-dd'T'HH:mm");
}

/** Whether a datetime-local range ends after it starts (both set and valid). */
export function endsAfterStart(start: string, end: string): boolean {
    const s = parseDate(start);
    const e = parseDate(end);
    return isValidDate(s) && isValidDate(e) && isAfter(e, s);
}

/**
 * Clamp a [start, end] pair into [min, max]; invalid inputs fall back to the bounds and end never precedes start.
 * Returns datetime-local strings.
 */
export function clampDateTimeRange(
    start: string,
    end: string,
    min: string | Date,
    max: string | Date,
): { startTime: string; endTime: string } {
    const lower = parseDate(min);
    const upper = parseDate(max);
    const s = parseDate(start);
    const e = parseDate(end);

    const startTime = clamp(isValidDate(s) ? s : lower, { start: lower, end: upper });
    const endTime = clamp(isValidDate(e) ? e : upper, { start: startTime, end: upper });

    return { startTime: toDateTimeLocalInput(startTime), endTime: toDateTimeLocalInput(endTime) };
}
