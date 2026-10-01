import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { getEnv } from "@/lib/env";
import { resolveTheme, type Theme, useTheme } from "@/lib/theme";

import { CUTOUT_LAYER_ID, cutoutLayer } from "./basemap/cutout";
import { basemapStyle, FIRST_LABEL_LAYER_ID, resolveTilesBase } from "./basemap/style";
import { configureMaplibreWorker } from "./basemap/worker";

type BasemapLayer = ReturnType<typeof maplibreGL>;
type BasemapOptions = Parameters<typeof maplibreGL>[0];

/**
 * The basemap: MapLibre GL draws the self-hosted Hungary vector tiles on a canvas in Leaflet's tile pane
 * (the maplibre-gl-leaflet plugin), while pins, labels and popups stay Leaflet's. Light and dark are two styles over
 * the same tiles (map/basemap/style.ts), swapped in place when the theme changes. The canvas is transparent beyond
 * the border (the cutout layer erases the tiles there), so the sky on the container behind it (map/Sky.tsx) shows
 * around the country.
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
            // One world: the cutout covers one copy, and the zoom floor never shows the next one anyway.
            renderWorldCopies: false,
            // Multisampling smooths the cut edge along the border (the cutout erases whole samples).
            canvasContextAttributes: { antialias: true },
        };
        const gl = maplibreGL(options);
        gl.addTo(map);
        // Custom layers are not part of the style document: the cutout goes in once the style is parsed (and again
        // after a full reload; the themed restyle is a diff, which leaves it where it is).
        const glMap = gl.getMaplibreMap();
        glMap.on("style.load", () => {
            if (!glMap.getLayer(CUTOUT_LAYER_ID)) glMap.addLayer(cutoutLayer(), FIRST_LABEL_LAYER_ID);
        });
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
