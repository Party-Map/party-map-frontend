import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { Hero } from "./Hero";

describe("Hero", () => {
    it("shows the artwork over its own blurred copy with the eyebrow, title, subtitle and actions", () => {
        renderWithProviders(
            <Hero
                image="https://images.example/night.jpg"
                alt="Techno Night"
                eyebrow="Techno"
                title="Techno Night"
                subtitle={<time dateTime="2030-06-01T20:00:00">Tomorrow</time>}
                actions={<button type="button">Share</button>}
            />,
        );
        const header = screen.getByRole("banner");
        expect(header).toHaveClass("hero");
        expect(header.getAttribute("style")).toContain('--hero-image: url("https://images.example/night.jpg")');
        expect(header.querySelector(".backdrop")).not.toBeNull();
        const image = screen.getByRole("img", { name: "Techno Night" });
        expect(image).toHaveAttribute("src", "https://images.example/night.jpg");
        expect(image.parentElement).toHaveClass("frame", "hero", "square", "art");
        expect(screen.getByRole("heading", { level: 1, name: "Techno Night" })).toHaveClass("title");
        expect(screen.getByText("Techno")).toHaveClass("eyebrow");
        expect(screen.getByText("Tomorrow")).toHaveAttribute("datetime", "2030-06-01T20:00:00");
        expect(screen.getByRole("button", { name: "Share" }).parentElement).toHaveClass("actions");
    });

    it("has no backdrop without an image, can be round, and renders nothing for an empty play slot", () => {
        renderWithProviders(<Hero image={null} alt="DJ Test" title="DJ Test" shape="round" />);
        const header = screen.getByRole("banner");
        expect(header).not.toHaveAttribute("style");
        expect(header.querySelector(".backdrop")).toBeNull();
        expect(header.querySelector(".actions")).toBeNull();
        expect(screen.getByRole("img", { name: "DJ Test" }).parentElement).toHaveClass("round");
    });

    it("puts the play slot before the actions when a page passes one", () => {
        renderWithProviders(<Hero image={null} alt="" title="X" play={<button type="button">Play</button>} />);
        expect(screen.getByRole("button", { name: "Play" }).parentElement).toHaveClass("actions");
    });
});
