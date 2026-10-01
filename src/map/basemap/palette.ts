import type { Theme } from "@/lib/theme";

/** A road class's fill and the darker outline drawn under it. */
export interface RoadColors {
    fill: string;
    casing: string;
}

export type RoadClass = "motorway" | "trunk" | "primary" | "secondary" | "tertiary" | "minor";

/** Every colour the basemap style uses; light and dark differ in nothing else. */
export interface Palette {
    /** Land where nothing else is drawn; also `--map-bg` in styles/base.scss. */
    background: string;
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
 * A cartoon take on Apple Maps: plain cream land, bright blue water, chunky white roads with soft brown outlines;
 * the dark palette keeps the same hierarchy on a deep slate land.
 */
export const PALETTES: Record<Theme, Palette> = {
    light: {
        background: "#f6efe0",
        water: "#9fd3f3",
        waterLine: "#86c5ee",
        roads: {
            motorway: { fill: "#ffffff", casing: "#c9bfae" },
            trunk: { fill: "#ffffff", casing: "#c9bfae" },
            primary: { fill: "#ffffff", casing: "#c9bfae" },
            secondary: { fill: "#ffffff", casing: "#cfc6b6" },
            tertiary: { fill: "#ffffff", casing: "#d5cdbf" },
            minor: { fill: "#fffdf8", casing: "#dcd4c6" },
        },
        boundary: "#b89f80",
        text: "#3b3630",
        textHalo: "#fffaf0",
        placeText: "#2e2a25",
        waterText: "#3f7fb8",
    },
    dark: {
        background: "#23262f",
        water: "#244b78",
        waterLine: "#2f5d8f",
        roads: {
            motorway: { fill: "#5a6075", casing: "#1b1e26" },
            trunk: { fill: "#5a6075", casing: "#1b1e26" },
            primary: { fill: "#5a6075", casing: "#1b1e26" },
            secondary: { fill: "#4f5568", casing: "#1b1e26" },
            tertiary: { fill: "#464b5c", casing: "#1b1e26" },
            minor: { fill: "#3d4251", casing: "#1b1e26" },
        },
        boundary: "#6a7088",
        text: "#e6e8ef",
        textHalo: "#23262f",
        placeText: "#f1f2f6",
        waterText: "#8fb6e6",
    },
};
