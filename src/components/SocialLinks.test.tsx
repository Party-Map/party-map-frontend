import { render, screen } from "@testing-library/react";

import { BrandIcon, SocialLinks } from "@/components/SocialLinks";
import type { Link } from "@/lib/types";

describe("SocialLinks", () => {
    it("renders nothing without links", () => {
        expect(render(<SocialLinks />).container).toBeEmptyDOMElement();
        expect(render(<SocialLinks links={[]} />).container).toBeEmptyDOMElement();
    });

    it("renders one external link per entry", () => {
        const links: Link[] = [
            { type: "INSTAGRAM", url: "https://instagram.com/a38" },
            { type: "WEBSITE", url: "https://a38.hu" },
        ];
        const { container } = render(<SocialLinks links={links} className="extra" />);
        expect(container.firstElementChild).toHaveClass("list", "extra");
        const rendered = screen.getAllByRole("link");
        expect(rendered).toHaveLength(2);
        const instagram = screen.getByRole("link", { name: "Instagram" });
        expect(instagram).toHaveAttribute("href", "https://instagram.com/a38");
        expect(instagram).toHaveAttribute("target", "_blank");
        expect(instagram).toHaveAttribute("rel", "noopener noreferrer");
        expect(instagram).toHaveClass("link");
        expect(instagram.querySelector(".glyph")).toHaveTextContent("IG");
        const website = screen.getByRole("link", { name: "Website" });
        expect(website).toHaveAttribute("href", "https://a38.hu");
        expect(website.querySelector("svg")?.getAttribute("class")).toMatch(/globe/);
    });
});

describe("BrandIcon", () => {
    it.each([
        ["INSTAGRAM", "IG"],
        ["FACEBOOK", "f"],
        ["TWITTER", "X"],
        ["REDDIT", "r"],
    ] as const)("shows a monogram for %s", (type, glyph) => {
        const { container } = render(<BrandIcon type={type} />);
        expect(container.querySelector(".glyph")).toHaveTextContent(glyph);
        expect(container.querySelector("svg")).toBeNull();
    });

    it("uses a globe for websites", () => {
        const { container } = render(<BrandIcon type="WEBSITE" />);
        expect(container.querySelector(".glyph")).toBeNull();
        expect(container.querySelector("svg")?.getAttribute("class")).toMatch(/globe/);
    });
});
