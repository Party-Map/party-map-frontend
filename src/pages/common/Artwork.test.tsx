import { render, screen } from "@testing-library/react";

import { Artwork } from "./Artwork";

describe("Artwork", () => {
    it("frames the image as a square row thumbnail by default", () => {
        render(<Artwork src="https://images.example/a.jpg" alt="A38" />);
        const img = screen.getByRole("img", { name: "A38" });
        expect(img).toHaveClass("image", "fill");
        const frame = img.parentElement!;
        expect(frame).toHaveClass("frame", "row", "square");
        expect(frame).not.toHaveClass("ambient");
        expect(frame).not.toHaveAttribute("style");
    });

    it("paints the glow from the image itself when ambient", () => {
        render(<Artwork src={'https://images.example/a"b.jpg'} alt="" size="hero" shape="round" ambient />);
        const frame = screen.getByRole("presentation").parentElement!;
        expect(frame).toHaveClass("frame", "hero", "round", "ambient");
        expect(frame.getAttribute("style")).toContain('--artwork-url: url("https://images.example/a\\"b.jpg")');
    });

    it("has nothing to glow with when the image is missing", () => {
        render(<Artwork src={null} alt="" size="card" ambient className="extra" />);
        const frame = screen.getByRole("presentation").parentElement!;
        expect(frame).toHaveClass("frame", "card", "square", "extra");
        expect(frame).not.toHaveClass("ambient");
        expect(frame).not.toHaveAttribute("style");
    });
});
