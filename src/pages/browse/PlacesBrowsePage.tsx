import { useEffect } from "react";

import { useBrowsePlaces, usePlaceTags } from "@/api/hooks";
import { Chip, ChipRow } from "@/components/Chip";
import { useUserLocation } from "@/layout/LocationProvider";
import { BROWSE_FACET_LIMIT, BROWSE_PAGE_SIZE } from "@/lib/constants";
import { PlaceRow } from "@/pages/common/PlaceRow";

import { BrowseResults } from "./BrowseResults";
import { FilterBar } from "./FilterBar";
import { LocationChip } from "./LocationChip";
import { RadiusChips } from "./RadiusChips";
import { useBrowseParams } from "./useBrowseParams";

const SORTS = [
    { value: "distance", label: "Nearest first" },
    { value: "name", label: "By name" },
];

/** Venues, nearest first by default, with the most used tags as filter chips. */
export function PlacesBrowsePage() {
    const [params, setParams] = useBrowseParams();
    const { origin, status, request } = useUserLocation();
    useEffect(() => {
        request();
    }, [request]);

    const sort = params.sort === "name" ? "name" : "distance";
    const places = useBrowsePlaces(
        {
            lat: origin.latitude,
            lon: origin.longitude,
            radiusKm: params.radius ?? undefined,
            tag: params.tag || undefined,
            q: params.search || undefined,
            sort: sort === "name" ? "name" : undefined,
            size: BROWSE_PAGE_SIZE,
        },
        { enabled: status !== "idle" && status !== "locating" },
    );
    const tags = usePlaceTags();

    return (
        <>
            <FilterBar
                search={params.search}
                onSearchChange={(search) => setParams({ search })}
                placeholder="Search places"
                sort={{
                    value: sort,
                    options: SORTS,
                    onChange: (next) => setParams({ sort: next === "name" ? "name" : null }),
                }}
            >
                <ChipRow label="Distance">
                    <LocationChip />
                    <RadiusChips value={params.radius} onChange={(radius) => setParams({ radius })} />
                </ChipRow>
                {tags.data && tags.data.length > 0 && (
                    <ChipRow label="Tags">
                        {tags.data.slice(0, BROWSE_FACET_LIMIT).map(({ tag }) => (
                            <Chip
                                key={tag}
                                pressed={params.tag === tag}
                                onClick={() => setParams({ tag: params.tag === tag ? null : tag })}
                            >
                                {tag}
                            </Chip>
                        ))}
                    </ChipRow>
                )}
            </FilterBar>
            <BrowseResults
                result={places}
                label="Places"
                noun={["place", "places"]}
                empty="No places match. Try a wider distance or fewer filters."
                loadingLabel={status === "locating" ? "Finding places near you…" : undefined}
            >
                {(item) => <PlaceRow key={item.id} item={item} />}
            </BrowseResults>
        </>
    );
}
