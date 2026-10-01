import hungary from "./hungary.json";

/** A closed ring of [longitude, latitude] pairs. */
export type Ring = [lon: number, lat: number][];

/** The whole Web Mercator world (latitudes beyond ±85° are off the map anyway). */
export const WORLD_RING: Ring = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
];

const [outline = []] = hungary.geometry.coordinates;
/** The country's border: OpenStreetMap relation 21335 simplified to about 200 m, wound counter-clockwise. */
export const HUNGARY_RING = outline as Ring;

/** The border as a GeoJSON feature, for the style's land fill. */
export const HUNGARY_OUTLINE: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [HUNGARY_RING] },
};
