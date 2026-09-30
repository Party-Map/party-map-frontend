import { screen } from "@testing-library/react";

import { searchHits } from "@/test/fixtures";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { AdminTopBar, TopBar } from "./TopBar";

describe("TopBar", () => {
    it("shows the brand, an empty search box, account actions and the theme toggle", async () => {
        mockApi({});
        renderWithProviders(<TopBar />);
        expect(await screen.findByRole("button", { name: "Sign in" })).toHaveClass("item", "desktop");
        expect(screen.getByRole("banner")).toHaveClass("top-wrapper");
        expect(screen.getByRole("link", { name: "PartyMap home" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
        expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
    });

    it("seeds the search box from the URL query and restores its results", async () => {
        mockApi({ "GET /api/search?q=techno": { query: "techno", hits: searchHits } });
        renderWithProviders(<TopBar />, { route: "/?q=techno" });
        expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("techno");
        expect(await screen.findByRole("listbox", { name: "Search results" })).toHaveTextContent("Techno Night");
    });
});

describe("AdminTopBar", () => {
    it("links to the admin home without a search box", async () => {
        renderWithProviders(<AdminTopBar />);
        expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
        expect(screen.getByRole("banner")).toHaveClass("admin-wrapper");
        expect(screen.getByRole("link", { name: "Admin Panel" })).toHaveAttribute("href", "/admin");
        expect(screen.queryByRole("textbox")).toBeNull();
        expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
    });
});
