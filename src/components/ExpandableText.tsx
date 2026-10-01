import { type CSSProperties, useCallback, useState } from "react";

import { cn } from "@/lib/utils";

import styles from "./ExpandableText.module.scss";

interface ExpandableTextProps {
    text: string;
    /** Lines shown before "More"; the toggle only appears when the text does not fit. */
    lines?: number;
    className?: string;
}

/** A long description clamped to a few lines with a More/Less toggle. */
export function ExpandableText({ text, lines = 4, className }: ExpandableTextProps) {
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);

    // A ref callback measures on mount and whenever the text changes (its identity changes with the text).
    const measure = useCallback(
        (element: HTMLParagraphElement | null) => {
            if (element) setOverflows(element.scrollHeight > element.clientHeight + 1);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the text is the re-measure trigger
        [text],
    );

    const clampStyle = expanded ? undefined : ({ "--lines": lines } as CSSProperties);
    const clamped = !expanded;
    return (
        <div className={className}>
            <p
                ref={measure}
                className={cn(styles.text, clamped && styles.clamped, clamped && overflows && styles.faded)}
                style={clampStyle}
            >
                {text}
            </p>
            {(overflows || expanded) && (
                <button
                    type="button"
                    className={styles.toggle}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? "Less" : "More"}
                </button>
            )}
        </div>
    );
}
