import { useEffect } from "react";

import { useBrowseEvents } from "@/api/hooks";
import { EVENT_TYPES } from "@/api/types";
import { Chip, ChipRow } from "@/components/Chip";
import { useUserLocation } from "@/layout/LocationProvider";
import { BROWSE_PAGE_SIZE, EVENT_TYPE_LABELS } from "@/lib/constants";
import { EventRow } from "@/pages/common/EventRow";

import { BrowseResults } from "./BrowseResults";
import { FilterBar } from "./FilterBar";
import { LocationChip } from "./LocationChip";
import { RadiusChips } from "./RadiusChips";
import { useBrowseParams } from "./useBrowseParams";

const SORTS = [
    { value: "distance", label: "Nearest first" },
    { value: "start", label: "Soonest first" },
];

/** Upcoming events, nearest first by default; the filters live in the URL. */
export function EventsBrowsePage() {
    const [params, setParams] = useBrowseParams();
    const { origin, status, request } = useUserLocation();
    useEffect(() => {
        request();
    }, [request]);

    const sort = params.sort === "start" ? "start" : "distance";
    const events = useBrowseEvents(
        {
            lat: origin.latitude,
            lon: origin.longitude,
            radiusKm: params.radius ?? undefined,
            kind: params.kind ?? undefined,
            q: params.search || undefined,
            sort: sort === "start" ? "start" : undefined,
            size: BROWSE_PAGE_SIZE,
        },
        // Wait for the position lookup so the first page is not fetched twice.
        { enabled: status !== "idle" && status !== "locating" },
    );

    return (
        <>
            <FilterBar
                search={params.search}
                onSearchChange={(search) => setParams({ search })}
                placeholder="Search events"
                sort={{
                    value: sort,
                    options: SORTS,
                    onChange: (next) => setParams({ sort: next === "start" ? "start" : null }),
                }}
            >
                <ChipRow label="Distance">
                    <LocationChip />
                    <RadiusChips value={params.radius} onChange={(radius) => setParams({ radius })} />
                </ChipRow>
                <ChipRow label="Kind">
                    {EVENT_TYPES.map((kind) => (
                        <Chip
                            key={kind}
                            pressed={params.kind === kind}
                            onClick={() => setParams({ kind: params.kind === kind ? null : kind })}
                        >
                            {EVENT_TYPE_LABELS[kind]}
                        </Chip>
                    ))}
                </ChipRow>
            </FilterBar>
            <BrowseResults
                result={events}
                label="Events"
                noun={["event", "events"]}
                empty="No events match. Try a wider distance or fewer filters."
                loadingLabel={status === "locating" ? "Finding events near you…" : undefined}
            >
                {(item) => <EventRow key={item.id} item={item} />}
            </BrowseResults>
        </>
    );
}
