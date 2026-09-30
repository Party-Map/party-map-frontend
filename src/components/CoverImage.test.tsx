import { fireEvent, render, screen } from "@testing-library/react";

import { PLACEHOLDER_IMAGE } from "@/lib/constants";

import { CoverImage } from "./CoverImage";

describe("CoverImage", () => {
    it("shows the source lazily with the large height by default", () => {
        render(<CoverImage src="https://images.example/a.jpg" alt="Cover" data-testid="cover" />);
        const img = screen.getByRole("img", { name: "Cover" });
        expect(img).toHaveAttribute("src", "https://images.example/a.jpg");
        expect(img).toHaveAttribute("loading", "lazy");
        expect(img).toHaveClass("image", "lg");
        expect(img).toHaveAttribute("data-testid", "cover");
    });

    it.each([null, undefined, ""])("falls back to the placeholder for %s", (src) => {
        render(<CoverImage src={src} alt="Cover" />);
        expect(screen.getByRole("img", { name: "Cover" })).toHaveAttribute("src", PLACEHOLDER_IMAGE);
    });

    it("falls back to the placeholder when the image fails to load", () => {
        render(<CoverImage src="https://images.example/broken.jpg" alt="Cover" />);
        const img = screen.getByRole("img", { name: "Cover" });
        fireEvent.error(img);
        expect(img).toHaveAttribute("src", PLACEHOLDER_IMAGE);
    });

    it("supports other heights and extra classes", () => {
        render(<CoverImage src="https://images.example/a.jpg" alt="Cover" height="sm" className="extra" />);
        expect(screen.getByRole("img", { name: "Cover" })).toHaveClass("image", "sm", "extra");
    });
});
