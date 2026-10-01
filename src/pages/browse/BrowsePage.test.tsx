import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router";

import { mockApi, renderWithProviders } from "@/test/helpers";

import { BrowsePage } from "./BrowsePage";

describe("BrowsePage", () => {
    it("shows the title, the three section tabs with the current one marked, and the section", () => {
        mockApi({});
        renderWithProviders(
            <Routes>
                <Route path="/browse" element={<BrowsePage />}>
                    <Route path="places" element={<p>places list</p>} />
                </Route>
            </Routes>,
            { route: "/browse/places?tag=ruin" },
        );
        expect(screen.getByRole("heading", { level: 1, name: "Browse" })).toBeInTheDocument();
        const tabs = screen.getByRole("navigation", { name: "Browse sections" });
        expect(
            within(tabs)
                .getAllByRole("link")
                .map((link) => link.getAttribute("href")),
        ).toEqual(["/browse/events", "/browse/places", "/browse/performers"]);
        expect(within(tabs).getByRole("link", { name: "Places" })).toHaveClass("tab", "active");
        expect(within(tabs).getByRole("link", { name: "Events" })).not.toHaveClass("active");
        expect(screen.getByText("places list")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Back" })).toBeNull();
    });
});
