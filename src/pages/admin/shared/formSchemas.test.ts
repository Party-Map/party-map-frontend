import { imageUrl, links, optionalText, requiredText } from "./formSchemas";

describe("form schemas", () => {
    it("requires text that is not just spaces", () => {
        expect(requiredText("Name").safeParse("  A38  ")).toEqual({ success: true, data: "A38" });
        const result = requiredText("Name").safeParse("   ");
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Name is required.");
    });

    it("trims optional text", () => {
        expect(optionalText.parse("  bio ")).toBe("bio");
    });

    it("accepts an http(s) image address or nothing", () => {
        expect(imageUrl.parse(" https://images.example/a.jpg ")).toBe("https://images.example/a.jpg");
        expect(imageUrl.parse("")).toBe("");
        expect(imageUrl.safeParse("ftp://images.example/a.jpg").success).toBe(false);
        expect(imageUrl.safeParse("not a url").error?.issues[0]?.message).toBe(
            "Enter a full http(s) address, or leave it empty.",
        );
    });

    it("passes the links through", () => {
        const value = [{ type: "WEBSITE" as const, url: "https://a38.hu" }];
        expect(links.parse(value)).toEqual(value);
    });
});
