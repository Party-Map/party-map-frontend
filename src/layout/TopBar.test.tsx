import { screen, within } from "@testing-library/react";

import { searchHits } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { TopBar } from "./TopBar";

describe("TopBar", () => {
    it("shows the brand with the explore links, an empty search box, account actions and the theme toggle", async () => {
        mockApi({});
        renderWithProviders(<TopBar />);
        expect(await screen.findByRole("button", { name: "Sign in" })).toHaveClass("item", "desktop");
        expect(screen.getByRole("banner")).toHaveClass("top-wrapper");
        expect(screen.getByRole("link", { name: "PartyMap home" })).toHaveAttribute("href", "/");
        const explore = screen.getByRole("navigation", { name: "Explore" });
        expect(within(explore).getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/browse");
        expect(screen.getByRole("navigation", { name: "Account" })).toContainElement(
            screen.getByRole("button", { name: "Sign in" }),
        );
        expect(screen.getByRole("combobox", { name: "Search" })).toHaveValue("");
        expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
    });

    it("seeds the search box from the URL query and restores its results", async () => {
        mockApi({ "GET /api/search?q=techno": { query: "techno", hits: searchHits } });
        renderWithProviders(<TopBar />, { route: "/?q=techno" });
        expect(screen.getByRole("combobox", { name: "Search" })).toHaveValue("techno");
        expect(await screen.findByRole("listbox", { name: "Search results" })).toHaveTextContent("Techno Night");
    });
});
