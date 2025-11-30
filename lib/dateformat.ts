import {Event} from "@/lib/types";
import moment from "moment";

export function dateTimeDisplayFormat(start: string, end: string) {
    const startMoment = moment(start);
    const endMoment = moment(end);

    const startDate = startMoment.calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'DD/MM/YYYY'
    });

    const endDate = endMoment.calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'DD/MM/YYYY'
    });

    const startTime = startMoment.format("HH:mm");
    const endTime = endMoment.format("HH:mm");

    // Same-day case
    if (startMoment.isSame(endMoment, "day")) {
        return `${startDate} • ${startTime} – ${endTime}`;
    }

    // Different-day case
    return `${startDate} ${startTime} – ${endDate} ${endTime}`;
}

export function eventDateTimeDisplayFormat(event: Event) {
    return dateTimeDisplayFormat(event.start, event.end);
}
