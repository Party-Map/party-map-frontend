import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { browsePerformersPage, performerGenres } from "@/test/fixtures";
import { type ApiMock, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformersBrowsePage } from "./PerformersBrowsePage";

const performerRequests = (fetchMock: ApiMock) =>
    fetchMock.requests
        .filter((request) => new URL(request.url).pathname === "/api/browse/performers")
        .map((request) => Object.fromEntries(new URL(request.url).searchParams));

describe("PerformersBrowsePage", () => {
    it("lists the performers with the genre chips and filters by a genre", async () => {
        const fetchMock = mockApi({
            "GET /api/browse/performers": browsePerformersPage,
            "GET /api/browse/performer-genres": performerGenres,
        });
        renderWithProviders(<PerformersBrowsePage />, {
            route: "/browse/performers?search=dj",
            path: "/browse/performers",
        });
        const list = await screen.findByRole("list", { name: "Performers" });
        expect(within(list).getByRole("link", { name: /DJ Test/ })).toHaveAttribute("href", "/performers/performer-1");
        expect(screen.getByText("1 performer")).toBeInTheDocument();
        expect(screen.queryByRole("combobox")).toBeNull();
        expect(performerRequests(fetchMock)).toEqual([{ q: "dj", size: "20", page: "0" }]);

        const genres = await screen.findByRole("group", { name: "Genre" });
        await userEvent.click(within(genres).getByRole("button", { name: "house" }));
        await screen.findByRole("button", { name: "house", pressed: true });
        expect(performerRequests(fetchMock).at(-1)).toEqual({ genre: "house", q: "dj", size: "20", page: "0" });

        await userEvent.click(screen.getByRole("button", { name: "house" }));
        await screen.findByRole("button", { name: "house", pressed: false });
        expect(performerRequests(fetchMock).at(-1)).toEqual({ q: "dj", size: "20", page: "0" });
    });
});
