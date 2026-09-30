import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";
import { fakeMap, reactLeafletMock } from "@/test/mocks/leaflet";

import { NewPlacePage } from "./NewPlacePage";

vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

const manager = authenticatedSnapshot([Role.PLACE_MANAGER]);
const reverseAnswer = {
    display_name: "Váci utca 5, Budapest, Hungary",
    address: { road: "Váci utca", house_number: "5", city: "Budapest" },
};

function renderPage(auth = manager) {
    return renderWithProviders(<NewPlacePage />, { route: "/admin/places/new", path: "/admin/places/new", auth });
}

describe("NewPlacePage", () => {
    beforeEach(() => fakeMap.reset());

    it("sends anonymous visitors to login", async () => {
        const { client } = renderWithProviders(<NewPlacePage />, {
            route: "/admin/places/new",
            path: "/admin/places/new",
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/places/new"));
    });

    it("shows the 404 page to users without the place manager role", async () => {
        renderPage(authenticatedSnapshot([Role.EVENT_ORGANIZER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("creates the place from the form and opens its page", async () => {
        const fetchMock = mockApi({
            "GET /reverse": reverseAnswer,
            "POST /api/places": { ...place, id: "place-9" },
        });
        renderPage();
        expect(await screen.findByRole("heading", { name: "Create a new place" })).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText("Name"), "  New Bar ");
        act(() => {
            reactLeafletMock.fireMapEvent("click", { latlng: { lat: 47.5, lng: 19.05 } });
        });
        expect(await screen.findByDisplayValue("Váci utca 5")).toBeInTheDocument();
        expect(screen.getByLabelText("City")).toHaveValue("Budapest");
        expect(screen.getByText("Lat: 47.50000 · Lng: 19.05000")).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText("Description"), "Cheap drinks.");
        await userEvent.type(screen.getByLabelText("Tags"), " bar , terrace,, ");
        await userEvent.click(screen.getByRole("button", { name: "+ Add link" }));
        await userEvent.type(screen.getByRole("textbox", { name: "Instagram link" }), "newbar");
        await userEvent.type(screen.getByLabelText("Cover image URL"), "https://images.example/bar.jpg");
        await userEvent.click(screen.getByRole("button", { name: "Create place" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.getByText("Place created.")).toBeInTheDocument();

        const postIndex = fetchMock.requests.findIndex((request) => request.method === "POST");
        expect(fetchMock.requests[postIndex]?.url).toBe("http://api.test/api/places");
        expect(requestBody(fetchMock, postIndex)).toEqual({
            name: "New Bar",
            address: "Váci utca 5",
            city: "Budapest",
            location: { latitude: 47.5, longitude: 19.05 },
            description: "Cheap drinks.",
            tags: ["bar", "terrace"],
            image: "https://images.example/bar.jpg",
            links: [{ type: "INSTAGRAM", url: "https://instagram.com/newbar" }],
        });
    });

    it("keeps the form with an error when the backend rejects the place", async () => {
        mockApi({
            "GET /reverse": reverseAnswer,
            "POST /api/places": () => new Response("bad request", { status: 400 }),
        });
        renderPage();
        expect(await screen.findByRole("heading", { name: "Create a new place" })).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText("Name"), "New Bar");
        act(() => {
            reactLeafletMock.fireMapEvent("click", { latlng: { lat: 47.5, lng: 19.05 } });
        });
        expect(await screen.findByDisplayValue("Budapest")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Create place" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Could not save place. Please try again.");
        expect(screen.getByRole("heading", { name: "Create a new place" })).toBeInTheDocument();
        expect(screen.queryByText("Place created.")).not.toBeInTheDocument();
    });
});
