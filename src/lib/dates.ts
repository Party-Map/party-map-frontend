/**
 * Date helpers. The backend stores LocalDateTime without a zone and sends ISO strings such as
 * "2025-12-20T20:00:00"; `new Date(iso)` parses those as local time, which is what the UI wants.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
const SHORT_DATE = new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" });
const SHORT_DATE_YEAR = new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", year: "numeric" });

export function parseDate(value: string | Date): Date {
    return value instanceof Date ? value : new Date(value);
}

export function isValidDate(date: Date): boolean {
    return !Number.isNaN(date.getTime());
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad(n: number): string {
    return n.toString().padStart(2, "0");
}

export function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "HH:mm" in 24-hour time. */
export function formatTime(value: string | Date): string {
    return TIME.format(parseDate(value));
}

/** Today / Tomorrow / Yesterday / weekday names within a week / DD/MM/YYYY otherwise. */
export function calendarDayLabel(value: string | Date, now: Date = new Date()): string {
    const date = parseDate(value);
    const dayDiff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Tomorrow";
    if (dayDiff === -1) return "Yesterday";
    if (dayDiff > 1 && dayDiff < 7) return WEEKDAY.format(date);
    if (dayDiff < -1 && dayDiff > -7) return `Last ${WEEKDAY.format(date)}`;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
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
    return date.getFullYear() === now.getFullYear() ? SHORT_DATE.format(date) : SHORT_DATE_YEAR.format(date);
}

/** "YYYY-MM-DD HH:mm" for admin labels. */
export function formatDateTime(value: string | Date): string {
    const d = parseDate(value);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Value for <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in local time, or "" when invalid. */
export function toDateTimeLocalInput(value: string | Date | null | undefined): string {
    if (!value) return "";
    const d = parseDate(value);
    if (!isValidDate(d)) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    let s = parseDate(start);
    let e = parseDate(end);

    if (!isValidDate(s)) s = lower;
    if (!isValidDate(e)) e = upper;
    if (s < lower) s = lower;
    if (e > upper) e = upper;
    if (e < s) e = s;

    return { startTime: toDateTimeLocalInput(s), endTime: toDateTimeLocalInput(e) };
}
