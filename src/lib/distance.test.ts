import { formatDistance } from "./distance";

describe("formatDistance", () => {
    it.each([
        [0, "0 m"],
        [0.35, "350 m"],
        [0.9996, "1000 m"],
        [1, "1.0 km"],
        [3.24, "3.2 km"],
        [9.96, "10.0 km"],
        [10, "10 km"],
        [161.762, "162 km"],
    ])("formats %s km as %s", (km, label) => {
        expect(formatDistance(km)).toBe(label);
    });
});
