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
    wood: string;
    grass: string;
    /** National parks and nature reserves, drawn translucent over the landcover. */
    park: string;
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
 * A cartoon take on Apple Maps: cream land, bright blue water, fresh greens, chunky white roads with soft brown
 * outlines and golden motorways; the dark palette keeps the same hierarchy on a deep slate land.
 */
export const PALETTES: Record<Theme, Palette> = {
    light: {
        background: "#f6efe0",
        wood: "#b9dc9c",
        grass: "#cfe8b0",
        park: "#b2d98f",
        water: "#9fd3f3",
        waterLine: "#86c5ee",
        roads: {
            motorway: { fill: "#ffd36a", casing: "#e0a93b" },
            trunk: { fill: "#ffe08f", casing: "#dfb45a" },
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
        wood: "#263a2e",
        grass: "#2a3f31",
        park: "#2f5038",
        water: "#244b78",
        waterLine: "#2f5d8f",
        roads: {
            motorway: { fill: "#a8893c", casing: "#6d5a2a" },
            trunk: { fill: "#8f7a3e", casing: "#5f512b" },
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
