import { cx } from "@/lib/cx";

describe("cx", () => {
    it("joins truthy class names", () => {
        expect(cx("a", false, null, undefined, "b")).toBe("a b");
    });

    it("returns an empty string when nothing is truthy", () => {
        expect(cx(false, undefined)).toBe("");
    });
});
