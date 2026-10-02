import { place } from "@/test/fixtures";

import { placeSchema, placeSummary, toPlaceFormValues, toPlacePayload } from "./placeFormSchema";

describe("place form", () => {
    it("starts empty for a new place", () => {
        expect(toPlaceFormValues()).toEqual({
            name: "",
            description: "",
            tags: [],
            address: "",
            city: "",
            location: null,
            image: "",
            links: [],
        });
    });

    it("prefills from a place, turning missing optional values into empty text", () => {
        const values = toPlaceFormValues({ ...place, description: null, image: null });
        expect(values).toMatchObject({ name: place.name, description: "", image: "", tags: place.tags });
    });

    it("requires a name, a city and a map position", () => {
        const result = placeSchema.safeParse(toPlaceFormValues());
        const messages = Object.fromEntries(result.error!.issues.map((issue) => [issue.path[0], issue.message]));
        expect(messages).toEqual({
            name: "Name is required.",
            city: "City is required.",
            location: "Pick the place on the map.",
        });
    });

    it("refuses a map position beyond the border", () => {
        const values = { ...toPlaceFormValues(), name: "Krakkói kirándulás", city: "Krakkó" };
        const abroad = placeSchema.safeParse({ ...values, location: { latitude: 50.0678, longitude: 19.9362 } });
        expect(abroad.error?.issues.map((issue) => issue.message)).toEqual(["The place must be inside Hungary."]);
        expect(placeSchema.safeParse({ ...values, location: { latitude: 47.4979, longitude: 19.0402 } }).success).toBe(
            true,
        );
    });

    it("builds the payload, leaving out empty links and sending no image as null", () => {
        const parsed = placeSchema.parse({ ...toPlaceFormValues(place), links: [], image: " " });
        expect(toPlacePayload(parsed)).toEqual({
            name: place.name,
            description: place.description,
            tags: place.tags,
            address: place.address,
            city: place.city,
            location: place.location,
            image: null,
        });
        const withLinks = placeSchema.parse(toPlaceFormValues(place));
        expect(toPlacePayload(withLinks).links).toEqual(place.links);
    });

    it("summarises every value for the review", () => {
        const rows = placeSummary({ ...toPlaceFormValues(), name: "A38", tags: ["bar", "boat"] });
        expect(rows.map((row) => [row.stepId, row.label, row.value])).toEqual([
            ["basics", "Name", "A38"],
            ["basics", "Description", "—"],
            ["basics", "Tags", "bar, boat"],
            ["location", "Address", "—"],
            ["location", "City", "—"],
            ["location", "Map position", "Not picked yet"],
            ["media", "Image", "—"],
            ["media", "Links", "—"],
        ]);
        expect(placeSummary({ ...toPlaceFormValues(), location: { latitude: 47.5, longitude: 19.05 } })[5]?.value).toBe(
            "47.50000, 19.05000",
        );
    });
});
