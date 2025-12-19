import {Event} from "@/lib/types"
import moment from "moment"

const CALENDAR_FORMATS = {
    sameDay: "[Today]",
    nextDay: "[Tomorrow]",
    nextWeek: "dddd",
    lastDay: "[Yesterday]",
    lastWeek: "[Last] dddd",
    sameElse: "DD/MM/YYYY",
}

function calendarDayLabel(m: moment.Moment) {
    return m.calendar(null, CALENDAR_FORMATS)
}

/**
 * Formats a start and end date-time for UI display
 *
 * Examples:
 * - Same day: "Today • 14:00 – 16:00"
 * - Different days: "Today 14:00 – Tomorrow 16:00"
 * - Far dates: "25/12/2024 14:00 – 01/01/2025 16:00"
 * @param start
 * @param end
 */
export function dateTimeDisplayFormat(start: string, end: string) {
    const startMoment = moment(start)
    const endMoment = moment(end)

    const startDate = calendarDayLabel(startMoment)
    const endDate = calendarDayLabel(endMoment)

    const startTime = startMoment.format("HH:mm")
    const endTime = endMoment.format("HH:mm")

    if (startMoment.isSame(endMoment, "day")) {
        return `${startDate} • ${startTime} – ${endTime}`
    }

    return `${startDate} ${startTime} – ${endDate} ${endTime}`
}

/**
 * Same as {@link dateTimeDisplayFormat}, but accepts an Event object.
 *
 * Examples:
 * - Same day: "Today • 14:00 – 16:00"
 * - Different days: "Today 14:00 – Tomorrow 16:00"
 * - Different days (different dates): "25/12/2024 14:00 – 01/01/2025 16:00"
 * @param event
 */
export function eventDateTimeDisplayFormat(event: Event) {
    return dateTimeDisplayFormat(event.start, event.end)
}

/**
 * Formats a single upcoming event start time for UI display
 * - If it's today: "HH:mm"
 * - Otherwise: "Mon D" (adds year if not the current year)
 * @param nextEventStart
 */
export function formatNextEventStartLabel(nextEventStart?: string | null): string | null {
    if (!nextEventStart) return null

    const d = new Date(nextEventStart)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()

    if (sameDay) {
        return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
    }

    const inYear = d.getFullYear() === now.getFullYear()
    return d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        ...(inYear ? {} : {year: "numeric"}),
    })
}
