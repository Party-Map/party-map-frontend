import { useEffect, useRef } from "react";

import { Button } from "@/components/Button";
import { useInView } from "@/lib/hooks/useInView";

import styles from "./LoadMore.module.scss";

interface LoadMoreProps {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

/** Loads the next page when scrolled into view, with a button for keyboards and browsers without observers. */
export function LoadMore({ hasNextPage, isFetchingNextPage, onLoadMore }: LoadMoreProps) {
    const [ref, inView] = useInView();
    const latest = useRef(onLoadMore);

    useEffect(() => {
        latest.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) latest.current();
    }, [inView, hasNextPage, isFetchingNextPage]);

    if (!hasNextPage) return null;

    return (
        <div ref={ref} className={styles.more}>
            <Button variant="secondary" size="sm" disabled={isFetchingNextPage} onClick={onLoadMore}>
                {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
        </div>
    );
}
