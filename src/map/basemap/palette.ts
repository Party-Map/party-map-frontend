import type { Theme } from "@/lib/theme";

/** A road class's fill and the darker outline drawn under it. */
export interface RoadColors {
    fill: string;
    casing: string;
}

export type RoadClass = "motorway" | "trunk" | "primary" | "secondary" | "tertiary" | "minor";

/** Every colour the basemap style uses; light and dark differ in nothing else. */
export interface Palette {
    /** The night sky around the country (the star pattern's base); also `--map-bg` in styles/base.scss. */
    sky: string;
    /** The stars' tint. */
    star: string;
    /** Hungary itself: the background everything else is drawn on. */
    land: string;
    water: string;
    waterLine: string;
    roads: Record<RoadClass, RoadColors>;
    boundary: string;
    text: string;
    textHalo: string;
    placeText: string;
    waterText: string;
}

/**
 * After a space-fantasy painting: a near-black, green-tinted starry sky around the country; sandy gold land,
 * lavender-blue water and gold-edged roads by day; slate-grey land with sage-green roads and pale gold names by
 * night. Pastel in both: nothing fully saturated, nothing pure white.
 */
export const PALETTES: Record<Theme, Palette> = {
    light: {
        sky: "#161d19",
        star: "#fff6dc",
        land: "#f3e9cc",
        water: "#b4bdee",
        waterLine: "#9ea9e6",
        roads: {
            motorway: { fill: "#fffbf2", casing: "#d8c58e" },
            trunk: { fill: "#fffbf2", casing: "#d8c58e" },
            primary: { fill: "#fffbf2", casing: "#d8c58e" },
            secondary: { fill: "#fffbf2", casing: "#ddcd9d" },
            tertiary: { fill: "#fffbf2", casing: "#e2d5ab" },
            minor: { fill: "#fdf8ea", casing: "#e7dcba" },
        },
        boundary: "#8d95d8",
        text: "#38418f",
        textHalo: "#f7f1dc",
        placeText: "#2d3685",
        waterText: "#5a65b9",
    },
    dark: {
        sky: "#0c110f",
        star: "#f3f0d8",
        land: "#3b3f49",
        water: "#4f5c86",
        waterLine: "#5d6a94",
        roads: {
            motorway: { fill: "#93b69b", casing: "#1c2272" },
            trunk: { fill: "#93b69b", casing: "#1c2272" },
            primary: { fill: "#93b69b", casing: "#1c2272" },
            secondary: { fill: "#7fa38a", casing: "#1c2272" },
            tertiary: { fill: "#6e8f7c", casing: "#1c2272" },
            minor: { fill: "#5c7a6b", casing: "#1c2272" },
        },
        boundary: "#a0a4bd",
        text: "#ece4c4",
        textHalo: "#3b3f49",
        placeText: "#f2ebd2",
        waterText: "#b8c2e6",
    },
};
