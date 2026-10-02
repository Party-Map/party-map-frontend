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

const lons = HUNGARY_RING.map(([lon]) => lon);
const lats = HUNGARY_RING.map(([, lat]) => lat);
const BOX = { west: Math.min(...lons), east: Math.max(...lons), south: Math.min(...lats), north: Math.max(...lats) };

/**
 * Whether a point lies inside the border (ray casting over the outline after a bounding-box check): the backend
 * applies the same rule to every place, so the forms can say so before saving.
 */
export function insideHungary([lon, lat]: [lon: number, lat: number]): boolean {
    if (lon < BOX.west || lon > BOX.east || lat < BOX.south || lat > BOX.north) return false;
    let inside = false;
    for (let i = 0, j = HUNGARY_RING.length - 1; i < HUNGARY_RING.length; j = i, i += 1) {
        const [xi, yi] = HUNGARY_RING[i] ?? [0, 0];
        const [xj, yj] = HUNGARY_RING[j] ?? [0, 0];
        if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
