import { linkSummary, NONE, orNone } from "./summary";

describe("review summary helpers", () => {
    it("show empty text as a dash", () => {
        expect(orNone("  ")).toBe(NONE);
        expect(orNone(" A38 ")).toBe("A38");
    });

    it("name the links by their type", () => {
        expect(linkSummary([])).toBe(NONE);
        expect(
            linkSummary([
                { type: "INSTAGRAM", url: "https://instagram.com/a38" },
                { type: "WEBSITE", url: "https://a38.hu" },
            ]),
        ).toBe("Instagram, Website");
    });
});
