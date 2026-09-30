import * as places from "./index";

describe("admin places index", () => {
    it("exposes the three routed pages", () => {
        expect(Object.keys(places).sort()).toEqual(["AdminPlacesPage", "EditPlacePage", "NewPlacePage"]);
        expect(places.AdminPlacesPage).toBeTypeOf("function");
        expect(places.EditPlacePage).toBeTypeOf("function");
        expect(places.NewPlacePage).toBeTypeOf("function");
    });
});
