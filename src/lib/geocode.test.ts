import { geocodeAddress, reverseGeocode } from "./geocode";

function stubFetch(body: unknown, status = 200) {
    const fetchMock = vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(body), { status }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof stubFetch>): URL {
    const input = fetchMock.mock.calls[0]?.[0];
    if (input === undefined) throw new Error("fetch was not called");
    return new URL(input instanceof URL ? input.href : typeof input === "string" ? input : input.url);
}

describe("geocodeAddress", () => {
    it("returns nothing for a blank query without calling the network", async () => {
        const fetchMock = stubFetch([]);
        await expect(geocodeAddress("   ")).resolves.toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("queries Nominatim with address details", async () => {
        const fetchMock = stubFetch([]);
        await geocodeAddress("Petőfi híd");
        const url = requestedUrl(fetchMock);
        expect(`${url.origin}${url.pathname}`).toBe("https://nominatim.openstreetmap.org/search");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            format: "json",
            addressdetails: "1",
            limit: "5",
            q: "Petőfi híd",
        });
        expect(fetchMock.mock.calls[0]?.[1]).toEqual({ headers: { Accept: "application/json" } });
    });

    it("maps street, postcode and city into an address line", async () => {
        stubFetch([
            {
                display_name: "Full",
                lat: "47.5",
                lon: "19.05",
                address: { road: "Fő utca", house_number: "1", postcode: "1011", city: "Budapest" },
            },
            { display_name: "Town", lat: "1", lon: "2", address: { town: "Szentendre", postcode: "2000" } },
            { display_name: "Village", lat: "3", lon: "4", address: { village: "Falu" } },
            { display_name: "Municipality", lat: "5", lon: "6", address: { municipality: "Járás", suburb: "Ignored" } },
            { display_name: "Suburb only", lat: "7", lon: "8", address: { suburb: "Lágymányos" } },
            { display_name: "No address", lat: "9", lon: "10" },
        ]);
        const results = await geocodeAddress("anything");
        expect(results).toEqual([
            {
                displayName: "Full",
                addressLine: "Fő utca 1, 1011, Budapest",
                city: "Budapest",
                location: { latitude: 47.5, longitude: 19.05 },
            },
            {
                displayName: "Town",
                addressLine: "2000, Szentendre",
                city: "Szentendre",
                location: { latitude: 1, longitude: 2 },
            },
            { displayName: "Village", addressLine: "Falu", city: "Falu", location: { latitude: 3, longitude: 4 } },
            {
                displayName: "Municipality",
                addressLine: "Járás",
                city: "Járás",
                location: { latitude: 5, longitude: 6 },
            },
            { displayName: "Suburb only", addressLine: "", location: { latitude: 7, longitude: 8 } },
            { displayName: "No address", addressLine: "", location: { latitude: 9, longitude: 10 } },
        ]);
        expect(results[4]).not.toHaveProperty("city");
        expect(results[5]).not.toHaveProperty("city");
    });

    it("returns nothing when Nominatim answers with an error", async () => {
        stubFetch({ error: "rate limited" }, 429);
        await expect(geocodeAddress("x")).resolves.toEqual([]);
    });
});

describe("reverseGeocode", () => {
    it("sends the coordinates", async () => {
        const fetchMock = stubFetch({});
        await reverseGeocode({ latitude: 47.4979, longitude: 19.0402 });
        const url = requestedUrl(fetchMock);
        expect(`${url.origin}${url.pathname}`).toBe("https://nominatim.openstreetmap.org/reverse");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            format: "jsonv2",
            lat: "47.4979",
            lon: "19.0402",
            addressdetails: "1",
        });
    });

    it("uses the street as the address line and the suburb as a city fallback", async () => {
        stubFetch({
            display_name: "Long display name",
            address: { road: "Öböl utca", house_number: "1", suburb: "Lágymányos" },
        });
        await expect(reverseGeocode({ latitude: 1, longitude: 2 })).resolves.toEqual({
            displayName: "Long display name",
            addressLine: "Öböl utca 1",
            city: "Lágymányos",
        });
    });

    it("prefers the city over the suburb", async () => {
        stubFetch({ display_name: "x", address: { road: "Fő utca", city: "Budapest", suburb: "Belváros" } });
        await expect(reverseGeocode({ latitude: 1, longitude: 2 })).resolves.toMatchObject({
            addressLine: "Fő utca",
            city: "Budapest",
        });
    });

    it("falls back to the display name without a road", async () => {
        stubFetch({ display_name: "Somewhere, Budapest", address: { city: "Budapest" } });
        await expect(reverseGeocode({ latitude: 1, longitude: 2 })).resolves.toEqual({
            displayName: "Somewhere, Budapest",
            addressLine: "Somewhere, Budapest",
            city: "Budapest",
        });
    });

    it("returns empty strings when the answer has no address at all", async () => {
        stubFetch({});
        const result = await reverseGeocode({ latitude: 1, longitude: 2 });
        expect(result).toEqual({ displayName: "", addressLine: "" });
        expect(result).not.toHaveProperty("city");
    });

    it("returns null on a failed request", async () => {
        stubFetch("nope", 500);
        await expect(reverseGeocode({ latitude: 1, longitude: 2 })).resolves.toBeNull();
    });
});
