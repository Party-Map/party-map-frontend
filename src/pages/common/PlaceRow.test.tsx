import { screen } from "@testing-library/react";

import { browsePlace, browsePlace2 } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { MediaList } from "./MediaList";
import { PlaceRow } from "./PlaceRow";

describe("PlaceRow", () => {
    it("shows the city and address, the first tags and the distance", () => {
        renderWithProviders(
            <MediaList label="Places">
                <PlaceRow item={{ ...browsePlace, tags: ["concert", "ship", "techno", "danube"] }} />
            </MediaList>,
        );
        const link = screen.getByRole("link", { name: /A38 Hajó/ });
        expect(link).toHaveAttribute("href", "/places/place-1");
        expect(link).toHaveTextContent("Budapest • Petőfi híd budai hídfő");
        expect(link).toHaveTextContent("concert, ship, techno… · 1.2 km");
    });

    it("copes with no address, no tags and no distance", () => {
        renderWithProviders(
            <MediaList label="Places">
                <PlaceRow item={{ ...browsePlace2, address: "", tags: [] }} />
            </MediaList>,
        );
        const link = screen.getByRole("link", { name: /Dürer Kert/ });
        expect(link.querySelectorAll("span")).toHaveLength(3);
        expect(link).toHaveTextContent(/Budapest$/);
    });
});
