import { useCallback, useEffect, useState } from "react";

/** Elements this close to the viewport count as visible, so a list loads its next page before the user reaches the end. */
const OPTIONS: IntersectionObserverInit = { rootMargin: "200px" };

/**
 * Whether the element given to the returned ref is in (or near) the viewport. Without IntersectionObserver (old
 * browsers, tests) it stays false, so callers keep a manual fallback.
 */
export function useInView(): [ref: (node: Element | null) => void, inView: boolean] {
    const [node, setNode] = useState<Element | null>(null);
    const [inView, setInView] = useState(false);
    const ref = useCallback((next: Element | null) => setNode(next), []);

    useEffect(() => {
        if (!node || typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), OPTIONS);
        observer.observe(node);
        return () => observer.disconnect();
    }, [node]);

    return [ref, inView];
}
