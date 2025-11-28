import Link from "next/link";
import {LineupItem} from "@/lib/types";
import moment from "moment";

export function LineupListItem({item}: { item: LineupItem }) {

    const TIME_DISPLAY_FORMAT = 'HH:mm';
    const startTime = moment(item.startTime, moment.HTML5_FMT.TIME_SECONDS).format(TIME_DISPLAY_FORMAT)
    const endTime = moment(item.endTime, moment.HTML5_FMT.TIME_SECONDS).format(TIME_DISPLAY_FORMAT)

    return (
        <li className="flex gap-3 sm:gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-zinc-950 p-3 sm:p-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link
                            href={`/performers/${item.performer.id}`}
                            className="font-semibold hover:text-violet-850 dark:hover:text-violet-400/60 break-words"
                        >
                            {item.performer.name}
                        </Link>
                    </div>

                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                        {startTime} - {endTime}
                    </span>
                </div>

                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                    {item.performer.genre}
                </p>
            </div>
        </li>
    )
}