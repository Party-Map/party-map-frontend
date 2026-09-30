import { cn } from "./utils";

describe("cn", () => {
    it("joins truthy class names", () => {
        expect(cn("a", false, null, undefined, "b")).toBe("a b");
    });

    it("returns an empty string when nothing is truthy", () => {
        expect(cn(false, undefined)).toBe("");
    });
});
