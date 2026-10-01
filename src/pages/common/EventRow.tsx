import type { BrowseEventItem } from "@/api/types";
import { formatDistance } from "@/lib/distance";
import { formatDateTimeRange } from "@/lib/format";

import { MediaRow } from "./MediaRow";

/** An event as the browse list and the shelves show it: when, where, how far. */
export function EventRow({ item, now }: { item: BrowseEventItem; now?: Date }) {
    return (
        <MediaRow
            to={`/events/${item.id}`}
            image={item.image}
            title={item.title}
            secondary={`${item.place.name} • ${item.place.city}`}
            meta={
                <>
                    <time dateTime={item.start}>{formatDateTimeRange(item.start, item.end, now)}</time>
                    {typeof item.distanceKm === "number" && ` · ${formatDistance(item.distanceKm)}`}
                </>
            }
            kind={item.kind}
        />
    );
}
