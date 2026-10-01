import { useBrowsePerformers, usePerformerGenres } from "@/api/hooks";
import { Chip, ChipRow } from "@/components/Chip";
import { BROWSE_FACET_LIMIT, BROWSE_PAGE_SIZE } from "@/lib/constants";
import { PerformerRow } from "@/pages/common/PerformerRow";

import { BrowseResults } from "./BrowseResults";
import { FilterBar } from "./FilterBar";
import { useBrowseParams } from "./useBrowseParams";

/** Performers by name, with the most common genres as filter chips. */
export function PerformersBrowsePage() {
    const [params, setParams] = useBrowseParams();
    const performers = useBrowsePerformers({
        genre: params.genre || undefined,
        q: params.search || undefined,
        size: BROWSE_PAGE_SIZE,
    });
    const genres = usePerformerGenres();

    return (
        <>
            <FilterBar
                search={params.search}
                onSearchChange={(search) => setParams({ search })}
                placeholder="Search performers"
            >
                {genres.data && genres.data.length > 0 && (
                    <ChipRow label="Genre">
                        {genres.data.slice(0, BROWSE_FACET_LIMIT).map(({ genre }) => (
                            <Chip
                                key={genre}
                                pressed={params.genre === genre}
                                onClick={() => setParams({ genre: params.genre === genre ? null : genre })}
                            >
                                {genre}
                            </Chip>
                        ))}
                    </ChipRow>
                )}
            </FilterBar>
            <BrowseResults
                result={performers}
                label="Performers"
                noun={["performer", "performers"]}
                empty="No performers match. Try fewer filters."
            >
                {(item) => <PerformerRow key={item.id} item={item} />}
            </BrowseResults>
        </>
    );
}
