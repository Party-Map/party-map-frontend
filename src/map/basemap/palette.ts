import type { Theme } from "@/lib/theme";

/** A road class's fill and the slightly darker casing drawn under it. */
export interface RoadColors {
    fill: string;
    casing: string;
}

export type RoadClass = "motorway" | "trunk" | "primary" | "secondary" | "tertiary" | "minor" | "service" | "path";

/** Every colour the basemap style uses; light and dark differ in nothing else. */
export interface Palette {
    /** Land where nothing else is drawn; also `--map-bg` in styles/base.scss. */
    background: string;
    wood: string;
    grass: string;
    farmland: string;
    /** National parks and nature reserves, drawn translucent over the landcover. */
    park: string;
    residential: string;
    water: string;
    waterLine: string;
    building: string;
    buildingOutline: string;
    roads: Record<RoadClass, RoadColors>;
    rail: string;
    aeroway: string;
    boundary: string;
    text: string;
    textHalo: string;
    placeText: string;
    waterText: string;
}

/**
 * Apple-Maps-like colours: warm off-white land, soft blue water, muted greens, white roads with faint casings and a
 * pale yellow for motorways; the dark palette keeps the same hierarchy on near-black land.
 */
export const PALETTES: Record<Theme, Palette> = {
    light: {
        background: "#f5f3ef",
        wood: "#d9e7d0",
        grass: "#e1ecd8",
        farmland: "#eeeadf",
        park: "#cfe6c3",
        residential: "#efece6",
        water: "#bbd9f0",
        waterLine: "#a9cdeb",
        building: "#e8e4dd",
        buildingOutline: "#dedad2",
        roads: {
            motorway: { fill: "#f8d59e", casing: "#e3b164" },
            trunk: { fill: "#fbe3b8", casing: "#e3bf7e" },
            primary: { fill: "#ffffff", casing: "#cdc7bc" },
            secondary: { fill: "#ffffff", casing: "#d1cbc1" },
            tertiary: { fill: "#ffffff", casing: "#d5cfc6" },
            minor: { fill: "#ffffff", casing: "#d9d4cb" },
            service: { fill: "#fbfaf7", casing: "#e0dcd4" },
            path: { fill: "#cfc9bf", casing: "#cfc9bf" },
        },
        rail: "#cfcac2",
        aeroway: "#e6e2da",
        boundary: "#b8b2a8",
        text: "#3c3c3c",
        textHalo: "#ffffff",
        placeText: "#2b2b2b",
        waterText: "#5b86ad",
    },
    dark: {
        background: "#1d1d1f",
        wood: "#1f271f",
        grass: "#232a22",
        farmland: "#212120",
        park: "#1f2e22",
        residential: "#222224",
        water: "#10233a",
        waterLine: "#193754",
        building: "#27272a",
        buildingOutline: "#2e2e31",
        roads: {
            motorway: { fill: "#5c5440", casing: "#6e6549" },
            trunk: { fill: "#514b3d", casing: "#625a48" },
            primary: { fill: "#4c4c50", casing: "#2a2a2c" },
            secondary: { fill: "#454549", casing: "#2a2a2c" },
            tertiary: { fill: "#3f3f43", casing: "#2a2a2c" },
            minor: { fill: "#38383c", casing: "#28282a" },
            service: { fill: "#303034", casing: "#262628" },
            path: { fill: "#48484d", casing: "#48484d" },
        },
        rail: "#3a3a3d",
        aeroway: "#2a2a2d",
        boundary: "#4a4a4f",
        text: "#d4d4d8",
        textHalo: "#1d1d1f",
        placeText: "#e4e4e7",
        waterText: "#6f9cc7",
    },
};
