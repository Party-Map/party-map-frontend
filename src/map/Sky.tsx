import { useEffect } from "react";
import { useMap } from "react-leaflet";

import { useTheme } from "@/lib/theme";

import { starSkyImage } from "./basemap/stars";

/**
 * The night sky: the theme's star field behind the basemap's canvas, which is transparent beyond the border
 * (map/Basemap.tsx). The component hands the generated image to the map container as `--map-sky`; the container's
 * rule in map/leaflet.scss lays it over the sky colour `--map-bg`. The container does not move with the map, so the
 * stars stay put while the country pans and zooms over them.
 */
export function Sky() {
    const map = useMap();
    const { theme } = useTheme();

    useEffect(() => {
        const style = map.getContainer().style;
        style.setProperty("--map-sky", starSkyImage(theme));
        return () => {
            style.removeProperty("--map-sky");
        };
    }, [map, theme]);

    return null;
}
