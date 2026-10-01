import { screen, within } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { TrackList, TrackRow } from "./TrackList";

describe("TrackList", () => {
    it("numbers the rows and links each one with its artwork, detail and right-aligned meta", () => {
        renderWithProviders(
            <TrackList label="Lineup">
                <TrackRow
                    index={1}
                    to="/performers/performer-1"
                    image="https://images.example/dj.jpg"
                    title="DJ Test"
                    secondary="techno"
                    meta="22:00 – 00:00"
                    shape="round"
                />
                <TrackRow index={2} to="/performers/performer-2" title="MC Two" />
            </TrackList>,
        );
        const list = screen.getByRole("list", { name: "Lineup" });
        expect(list.tagName).toBe("OL");
        const rows = within(list).getAllByRole("listitem");
        expect(rows).toHaveLength(2);
        const first = within(rows[0]!).getByRole("link", { name: /DJ Test/ });
        expect(first).toHaveAttribute("href", "/performers/performer-1");
        expect(within(first).getByText("1")).toHaveClass("index");
        expect(within(first).getByText("techno")).toHaveClass("secondary");
        expect(within(first).getByText("22:00 – 00:00")).toHaveClass("meta");
        expect(within(first).getByRole("presentation").parentElement).toHaveClass("round", "ambient");
        const second = within(rows[1]!).getByRole("link", { name: /MC Two/ });
        expect(second.querySelector(".meta")).toBeNull();
        expect(second.querySelector(".secondary")).toBeNull();
    });
});
