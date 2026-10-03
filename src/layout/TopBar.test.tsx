import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

    it("steps the brand aside while the search is in use", async () => {
        mockApi({});
        renderWithProviders(<TopBar />);
        const lead = screen.getByRole("link", { name: "PartyMap home" }).parentElement;
        expect(lead).toHaveClass("lead");
        expect(lead).not.toHaveClass("lead-collapsed");

        const user = userEvent.setup();
        await user.click(screen.getByRole("combobox", { name: "Search" }));
        expect(lead).toHaveClass("lead-collapsed");

        await user.click(screen.getByRole("button", { name: "Close search" }));
        expect(lead).not.toHaveClass("lead-collapsed");
    });

    it("seeds the search box from the URL query and shows its results once the box is used", async () => {
        mockApi({ "GET /api/search?q=techno": { query: "techno", hits: searchHits } });
        renderWithProviders(<TopBar />, { route: "/?q=techno" });
        const box = screen.getByRole("combobox", { name: "Search" });
        expect(box).toHaveValue("techno");
        // The page came with the query (nothing was followed): the list waits until the box is focused.
        await act(async () => {});
        expect(screen.queryByRole("listbox", { name: "Search results" })).toBeNull();
        await userEvent.click(box);
        expect(await screen.findByRole("listbox", { name: "Search results" })).toHaveTextContent("Techno Night");
    });
});
