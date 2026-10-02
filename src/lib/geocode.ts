import { useQuery } from "@tanstack/react-query";

import type { GeoPoint } from "@/api/types";

/** An address found by Nominatim (OpenStreetMap), not by our API. */
export interface GeocodeResult {
    displayName: string;
    addressLine: string;
    location: GeoPoint;
    city?: string;
}

/** The address at a point, from Nominatim. */
export interface ReverseGeocodeResult {
    displayName: string;
    addressLine: string;
    city?: string;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";

interface NominatimAddress {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    postcode?: string;
}

interface NominatimSearchItem {
    display_name: string;
    lat: string;
    lon: string;
    address?: NominatimAddress;
}

interface NominatimReverse {
    display_name?: string;
    address?: NominatimAddress;
}

function cityOf(addr: NominatimAddress, includeSuburb = false): string | undefined {
    return addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? (includeSuburb ? addr.suburb : undefined);
}

function streetOf(addr: NominatimAddress): string {
    return [addr.road, addr.house_number].filter(Boolean).join(" ");
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
    if (!query.trim()) return [];

    const url = new URL(`${NOMINATIM}/search`);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    // Places must lie inside Hungary (the API refuses the rest), so only Hungarian addresses are offered.
    url.searchParams.set("countrycodes", "hu");
    url.searchParams.set("q", query);

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];

    const items = (await res.json()) as NominatimSearchItem[];
    return items.map((item) => {
        const addr = item.address ?? {};
        const city = cityOf(addr);
        const addressLine = [streetOf(addr) || undefined, addr.postcode, city].filter(Boolean).join(", ");
        const result: GeocodeResult = {
            displayName: item.display_name,
            addressLine,
            location: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) },
        };
        if (city) result.city = city;
        return result;
    });
}

export async function reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null> {
    const url = new URL(`${NOMINATIM}/reverse`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(point.latitude));
    url.searchParams.set("lon", String(point.longitude));
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;

    const data = (await res.json()) as NominatimReverse;
    const addr = data.address ?? {};
    const addressLine = streetOf(addr) || data.display_name || "";
    const city = cityOf(addr, true);
    const result: ReverseGeocodeResult = { displayName: data.display_name ?? addressLine, addressLine };
    if (city) result.city = city;
    return result;
}

/** Addresses matching a query, cached per query for a few minutes (Nominatim asks for light use). */
export function useAddressSearch(query: string) {
    return useQuery({
        queryKey: ["geocode", query],
        queryFn: () => geocodeAddress(query),
        enabled: query.trim() !== "",
        staleTime: 5 * 60_000,
    });
}
