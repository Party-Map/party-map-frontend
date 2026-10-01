import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/Button";

import styles from "./Pager.module.scss";

interface PagerProps {
    /** Zero-based. */
    page: number;
    size: number;
    total: number;
    onPageChange: (page: number) => void;
}

/** "21–40 of 57" with previous and next buttons; hidden when everything fits on one page. */
export function Pager({ page, size, total, onPageChange }: PagerProps) {
    if (total <= size && page === 0) return null;
    const from = Math.min(total, page * size + 1);
    const to = Math.min(total, (page + 1) * size);
    return (
        <nav className={styles.pager} aria-label="Pages">
            <span className={styles.range}>
                {from}–{to} of {total}
            </span>
            <div className={styles.buttons}>
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft size={16} aria-hidden />
                    Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={to >= total} onClick={() => onPageChange(page + 1)}>
                    Next
                    <ChevronRight size={16} aria-hidden />
                </Button>
            </div>
        </nav>
    );
}
