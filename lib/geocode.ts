import {GeocodeResult, GeoPoint, ReverseGeocodeResult} from "@/lib/types";

export async function geocodeAddress(q: string): Promise<GeocodeResult[]> {
    if (!q.trim()) return []

    // https://nominatim.openstreetmap.org/
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("format", "json")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("limit", "5")
    url.searchParams.set("q", q)

    const res = await fetch(url.toString(), {
        headers: {
            "Accept": "application/json"
        }
    })

    if (!res.ok) return []

    const data = await res.json() as any[]
    return data.map((d): GeocodeResult => {
        const addr = d.address ?? {}

        const city =
            addr.city ??
            addr.town ??
            addr.village ??
            addr.municipality ??
            undefined

        const postcode: string | undefined = addr.postcode

        const street = [addr.road, addr.house_number].filter(Boolean).join(" ")

        const addressLine = [
            street || undefined,
            postcode,
            city,
        ].filter(Boolean).join(", ")

        const location: GeoPoint = {
            latitude: parseFloat(d.lat),
            longitude: parseFloat(d.lon),
        }

        return {
            displayName: d.display_name as string, // raw Nominatim long form
            addressLine,
            location,
            city,
            postcode,
        }
    })
}

export async function reverseGeocode(
    geoPoint: GeoPoint,
): Promise<ReverseGeocodeResult | null> {
    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("lat", geoPoint.latitude.toString())
    url.searchParams.set("lon", geoPoint.longitude.toString())
    url.searchParams.set("addressdetails", "1")

    const res = await fetch(url.toString(), {
        headers: {"Accept": "application/json"},
    })

    if (!res.ok) return null

    const data = await res.json() as any
    const addr = data.address ?? {}

    const city =
        addr.city ??
        addr.town ??
        addr.village ??
        addr.municipality ??
        addr.suburb ??
        undefined

    const streetParts = [addr.road, addr.house_number].filter(Boolean).join(" ")
    const addressLine = streetParts || data.display_name || ""

    return {
        displayName: data.display_name ?? addressLine,
        addressLine,
        city,
    }
}
