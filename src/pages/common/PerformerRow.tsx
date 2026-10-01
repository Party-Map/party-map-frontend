import type { BrowsePerformerItem } from "@/api/types";

import { MediaRow } from "./MediaRow";

/** A performer as the browse list shows it: a round portrait and the genre. */
export function PerformerRow({ item }: { item: BrowsePerformerItem }) {
    return (
        <MediaRow
            to={`/performers/${item.id}`}
            image={item.image}
            title={item.name}
            secondary={item.genre}
            shape="round"
        />
    );
}
