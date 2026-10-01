import type { BrowsePlaceItem } from "@/api/types";
import { formatDistance } from "@/lib/distance";

import { MediaRow } from "./MediaRow";

/** How many tags a row lists before "…". */
const TAGS_SHOWN = 3;

/** A venue as the browse list shows it: city and address, a few tags, how far. */
export function PlaceRow({ item }: { item: BrowsePlaceItem }) {
    const tags = item.tags.slice(0, TAGS_SHOWN).join(", ") + (item.tags.length > TAGS_SHOWN ? "…" : "");
    const parts = [tags, typeof item.distanceKm === "number" ? formatDistance(item.distanceKm) : ""].filter(Boolean);
    return (
        <MediaRow
            to={`/places/${item.id}`}
            image={item.image}
            title={item.name}
            secondary={item.address ? `${item.city} • ${item.address}` : item.city}
            meta={parts.length > 0 ? parts.join(" · ") : undefined}
        />
    );
}
