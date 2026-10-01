import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { MediaList } from "@/pages/common/MediaList";

import styles from "./BrowseResults.module.scss";
import { LoadMore } from "./LoadMore";

interface Page<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
}

export type BrowseQueryResult<T> = UseInfiniteQueryResult<InfiniteData<Page<T>>>;

interface BrowseResultsProps<T> {
    result: BrowseQueryResult<T>;
    /** The list's accessible name. */
    label: string;
    noun: [singular: string, plural: string];
    empty: string;
    loadingLabel?: string;
    children: (item: T) => ReactNode;
}

/** The states of a browse list: loading, failed, empty, or the rows with their count and the next page. */
export function BrowseResults<T>({ result, label, noun, empty, loadingLabel, children }: BrowseResultsProps<T>) {
    if (result.isPending) return <LoadingState label={loadingLabel} />;
    if (result.isError) {
        return <ErrorState message={`Could not load the ${noun[1]}.`} onRetry={() => void result.refetch()} />;
    }
    const items = result.data.pages.flatMap((page) => page.items);
    const total = result.data.pages[0]?.total ?? 0;
    if (items.length === 0) return <EmptyState message={empty} />;

    return (
        <>
            <p className={styles.count} aria-live="polite">
                {total} {total === 1 ? noun[0] : noun[1]}
            </p>
            <MediaList label={label}>{items.map(children)}</MediaList>
            <LoadMore
                hasNextPage={result.hasNextPage}
                isFetchingNextPage={result.isFetchingNextPage}
                onLoadMore={() => void result.fetchNextPage()}
            />
        </>
    );
}
