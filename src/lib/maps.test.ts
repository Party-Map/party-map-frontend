import { directionsUrl } from "./maps";

describe("directionsUrl", () => {
    it("points Google Maps directions at the coordinates", () => {
        expect(directionsUrl({ latitude: 47.4771, longitude: 19.0621 })).toBe(
            "https://www.google.com/maps/dir/?api=1&destination=47.4771,19.0621",
        );
    });
});
