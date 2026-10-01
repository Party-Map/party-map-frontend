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
 * Pastel and easy on the eye: warm light-grey land, powder-blue water, white roads with faint outlines and soft
 * grey text; the dark palette is a muted slate with dusty blue water and low-contrast roads.
 */
export const PALETTES: Record<Theme, Palette> = {
    light: {
        background: "#f3f0ea",
        water: "#c6dcee",
        waterLine: "#b6cfe4",
        roads: {
            motorway: { fill: "#ffffff", casing: "#dbd5cb" },
            trunk: { fill: "#ffffff", casing: "#dbd5cb" },
            primary: { fill: "#ffffff", casing: "#dbd5cb" },
            secondary: { fill: "#ffffff", casing: "#dfd9d0" },
            tertiary: { fill: "#ffffff", casing: "#e3ded5" },
            minor: { fill: "#fdfcfa", casing: "#e7e2da" },
        },
        boundary: "#c9bfb1",
        text: "#5c5750",
        textHalo: "#f7f4ee",
        placeText: "#4d4842",
        waterText: "#7f9fbe",
    },
    dark: {
        background: "#292c34",
        water: "#374a66",
        waterLine: "#405676",
        roads: {
            motorway: { fill: "#4b505c", casing: "#23262d" },
            trunk: { fill: "#4b505c", casing: "#23262d" },
            primary: { fill: "#4b505c", casing: "#23262d" },
            secondary: { fill: "#454a56", casing: "#23262d" },
            tertiary: { fill: "#40454f", casing: "#23262d" },
            minor: { fill: "#3a3f49", casing: "#23262d" },
        },
        boundary: "#5d6376",
        text: "#c3c7d1",
        textHalo: "#292c34",
        placeText: "#d2d5de",
        waterText: "#95abc8",
    },
};
