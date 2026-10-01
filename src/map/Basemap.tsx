import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { getEnv } from "@/lib/env";
import { resolveTheme, type Theme, useTheme } from "@/lib/theme";

import { basemapStyle, resolveTilesBase } from "./basemap/style";
import { configureMaplibreWorker } from "./basemap/worker";

type BasemapLayer = ReturnType<typeof maplibreGL>;
type BasemapOptions = Parameters<typeof maplibreGL>[0];

/**
 * The basemap: MapLibre GL draws the self-hosted Hungary vector tiles on a canvas in Leaflet's tile pane
 * (the maplibre-gl-leaflet plugin), while pins, labels and popups stay Leaflet's. Light and dark are two styles over
 * the same tiles (map/basemap/style.ts), swapped in place when the theme changes.
 */
export function Basemap() {
    const map = useMap();
    const { theme } = useTheme();
    const layer = useRef<BasemapLayer | null>(null);
    const appliedTheme = useRef<Theme | null>(null);

    useEffect(() => {
        configureMaplibreWorker();
        const initialTheme = resolveTheme();
        const options: BasemapOptions = {
            style: basemapStyle(initialTheme, resolveTilesBase(getEnv().tilesBase)),
            interactive: false,
        };
        const gl = maplibreGL(options);
        gl.addTo(map);
        layer.current = gl;
        appliedTheme.current = initialTheme;
        return () => {
            gl.remove();
            layer.current = null;
            appliedTheme.current = null;
        };
    }, [map]);

    useEffect(() => {
        if (!layer.current || appliedTheme.current === theme) return;
        appliedTheme.current = theme;
        // diff: the source stays, only the layers' colours change, so no tile is fetched again.
        layer.current.getMaplibreMap().setStyle(basemapStyle(theme, resolveTilesBase(getEnv().tilesBase)), {
            diff: true,
        });
    }, [theme]);

    return null;
}
