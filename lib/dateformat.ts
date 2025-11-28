import {Event} from "@/lib/types";
import moment from "moment";

export function dateTimeDisplayFormat(start: string, end: string) {
    const date = moment(start).calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'DD/MM/YYYY'
    });

    const startTime = moment(start).format("HH:mm");
    const endTime = moment(end).format("HH:mm");

    return `${date} • ${startTime} – ${endTime}`
}

export function eventDateTimeDisplayFormat(event: Event) {
    return dateTimeDisplayFormat(event.start, event.end);

}