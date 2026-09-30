import { type DependencyList, useCallback, useEffect, useState } from "react";

export interface Resource<T> {
    data: T | null;
    error: Error | null;
    loading: boolean;
    reload: () => void;
}

interface Result<T> {
    key: string;
    data: T | null;
    error: Error | null;
}

/**
 * Load async data for a component. Re-runs when `deps` change (deps must be primitives), ignores
 * stale results, keeps the previous data visible while reloading, and exposes `reload` for after
 * mutations. Pass `enabled: false` to skip loading (for example while auth is still initialising).
 */
export function useResource<T>(
    loader: () => Promise<T>,
    deps: DependencyList,
    options: { enabled?: boolean } = {},
): Resource<T> {
    const enabled = options.enabled ?? true;
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState<Result<T> | null>(null);

    // Identifies one load; results are only applied while their key is still the current one.
    const key = [enabled, version, ...deps].map(String).join("|");

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        loader().then(
            (data) => {
                if (!cancelled) setResult({ key, data, error: null });
            },
            (err: unknown) => {
                if (!cancelled)
                    setResult({ key, data: null, error: err instanceof Error ? err : new Error(String(err)) });
            },
        );

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const settled = result !== null && result.key === key;
    return {
        data: result?.data ?? null,
        error: settled ? result.error : null,
        loading: enabled && !settled,
        reload,
    };
}
