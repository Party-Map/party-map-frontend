import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { browsePlacesPage, placeTags } from "@/test/fixtures";
import { type ApiMock, mockApi, renderWithProviders } from "@/test/helpers";

import { PlacesBrowsePage } from "./PlacesBrowsePage";

const placeRequests = (fetchMock: ApiMock) =>
    fetchMock.requests
        .filter((request) => new URL(request.url).pathname === "/api/browse/places")
        .map((request) => Object.fromEntries(new URL(request.url).searchParams));

describe("PlacesBrowsePage", () => {
    it("lists the places nearest first with the tag chips, and filters by a tag", async () => {
        const fetchMock = mockApi({
            "GET /api/browse/places": browsePlacesPage,
            "GET /api/browse/place-tags": placeTags,
        });
        renderWithProviders(<PlacesBrowsePage />, { route: "/browse/places", path: "/browse/places" });
        const list = await screen.findByRole("list", { name: "Places" });
        expect(within(list).getByRole("link", { name: /A38 Hajó/ })).toHaveAttribute("href", "/places/place-1");
        expect(screen.getByText("2 places")).toBeInTheDocument();
        expect(placeRequests(fetchMock)).toEqual([{ lat: "47.4979", lon: "19.0402", size: "20", page: "0" }]);

        const tags = await screen.findByRole("group", { name: "Tags" });
        expect(
            within(tags)
                .getAllByRole("button")
                .map((chip) => chip.textContent),
        ).toEqual(["techno", "garden"]);
        await userEvent.click(within(tags).getByRole("button", { name: "techno" }));
        await screen.findByRole("button", { name: "techno", pressed: true });
        expect(placeRequests(fetchMock).at(-1)).toEqual({
            lat: "47.4979",
            lon: "19.0402",
            tag: "techno",
            size: "20",
            page: "0",
        });

        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "name");
        await screen.findByDisplayValue("By name");
        expect(placeRequests(fetchMock).at(-1)).toMatchObject({ sort: "name", tag: "techno" });
    });

    it("sends the radius and search from the URL and hides the tag row without facets", async () => {
        const fetchMock = mockApi({ "GET /api/browse/places": browsePlacesPage, "GET /api/browse/place-tags": [] });
        renderWithProviders(<PlacesBrowsePage />, {
            route: "/browse/places?radius=5&search=ship&tag=techno",
            path: "/browse/places",
        });
        await screen.findByRole("list", { name: "Places" });
        expect(placeRequests(fetchMock)).toEqual([
            { lat: "47.4979", lon: "19.0402", radiusKm: "5", tag: "techno", q: "ship", size: "20", page: "0" },
        ]);
        expect(screen.queryByRole("group", { name: "Tags" })).toBeNull();
    });
});
