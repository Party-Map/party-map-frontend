import { imageUrl, links, optionalShortText, optionalText, requiredText, tags } from "./formSchemas";

describe("form schemas", () => {
    it("requires text that is not just spaces", () => {
        expect(requiredText("Name").safeParse("  A38  ")).toEqual({ success: true, data: "A38" });
        const result = requiredText("Name").safeParse("   ");
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Name is required.");
    });

    it("limits one-line text to the API's 255 characters", () => {
        expect(requiredText("Name").safeParse("x".repeat(255)).success).toBe(true);
        expect(requiredText("Name").safeParse("x".repeat(256)).error?.issues[0]?.message).toBe(
            "Name can be at most 255 characters.",
        );
        expect(requiredText("Price", 10).safeParse("12345678901").success).toBe(false);
        expect(optionalShortText("Address").parse("")).toBe("");
        expect(optionalShortText("Address").safeParse("x".repeat(256)).error?.issues[0]?.message).toBe(
            "Address can be at most 255 characters.",
        );
    });

    it("accepts up to 20 tags of up to 40 characters", () => {
        expect(tags.parse([" techno ", "bar"])).toEqual(["techno", "bar"]);
        expect(tags.safeParse(Array.from({ length: 21 }, (_, i) => `t${i}`)).error?.issues[0]?.message).toBe(
            "Up to 20 tags.",
        );
        expect(tags.safeParse(["x".repeat(41)]).error?.issues[0]?.message).toBe("A tag can be at most 40 characters.");
    });

    it("rejects an image address longer than the API stores", () => {
        expect(imageUrl.safeParse(`https://a.example/${"x".repeat(2048)}`).success).toBe(false);
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
