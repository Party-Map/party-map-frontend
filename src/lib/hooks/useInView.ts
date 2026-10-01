import { useCallback, useEffect, useState } from "react";

/** Elements this close to the viewport count as visible, so a list loads its next page before the user reaches the end. */
const NEAR: IntersectionObserverInit = { rootMargin: "200px" };

const supported = () => typeof IntersectionObserver !== "undefined";

/**
 * Whether the element given to the returned ref is in (or near) the viewport (null until the observer has answered
 * once), and whether the browser can tell at all. Without IntersectionObserver (old browsers, tests) `inView` stays
 * null, so callers keep a manual fallback. Pass a module-level `options` object: a new object per render would
 * re-observe on every render.
 */
export function useInView(
    options: IntersectionObserverInit = NEAR,
): [ref: (node: Element | null) => void, inView: boolean | null, supported: boolean] {
    const [node, setNode] = useState<Element | null>(null);
    const [inView, setInView] = useState<boolean | null>(null);
    const [canObserve] = useState(supported);
    const ref = useCallback((next: Element | null) => setNode(next), []);

    useEffect(() => {
        if (!node || !canObserve) return;
        const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), options);
        observer.observe(node);
        return () => observer.disconnect();
    }, [node, canObserve, options]);

    return [ref, inView, canObserve];
}
