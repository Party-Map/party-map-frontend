import { lazy, Suspense } from "react";

// MapLibre GL is the heaviest dependency of the app and only the maps need it: the chunk loads with the first map.
const Basemap = lazy(() => import("./Basemap").then((module) => ({ default: module.Basemap })));

/** The basemap, loaded on demand; until then the map shows the sky (map/Sky.tsx) alone. */
export function LazyBasemap() {
    return (
        <Suspense fallback={null}>
            <Basemap />
        </Suspense>
    );
}
