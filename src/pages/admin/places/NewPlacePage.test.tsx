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
    return renderWithProviders(<NewPlacePage />, {
        route: "/admin/places/new",
        path: "/admin/places/new",
        auth,
        dataRouter: true,
    });
}

const next = () => userEvent.click(screen.getByRole("button", { name: "Next" }));

async function fillBasicsAndPin() {
    await userEvent.type(await screen.findByLabelText("Name"), "  New Bar ");
    await userEvent.type(screen.getByLabelText("Description"), "Cheap drinks.");
    await userEvent.type(screen.getByLabelText("Tags"), "bar{Enter}terrace,");
    await next();
    await screen.findByRole("heading", { name: "Location" });
    act(() => {
        reactLeafletMock.fireMapEvent("click", { latlng: { lat: 47.5, lng: 19.05 } });
    });
    expect(await screen.findByDisplayValue("Váci utca 5")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toHaveValue("Budapest");
    expect(screen.getByText("Lat 47.50000 · Lng 19.05000")).toBeInTheDocument();
}

describe("NewPlacePage", () => {
    beforeEach(() => fakeMap.reset());

    it("sends anonymous visitors to login", async () => {
        const { client } = renderWithProviders(<NewPlacePage />, {
            route: "/admin/places/new",
            path: "/admin/places/new",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/places/new"));
    });

    it("shows the 404 page to users without the place manager role", async () => {
        renderPage(authenticatedSnapshot([Role.EVENT_ORGANIZER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("needs a name before the location, and a pin before the image", async () => {
        mockApi({});
        renderPage();
        expect(await screen.findByRole("heading", { level: 1, name: "New place" })).toBeInTheDocument();

        await next();
        expect(await screen.findByText("Name is required.")).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText("Name"), "Bar");
        await next();
        await userEvent.type(await screen.findByLabelText("City"), "Budapest");
        await next();
        expect(await screen.findByText("Pick the place on the map.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Location" })).toBeInTheDocument();
    });

    it("creates the place through every step and opens its admin page", async () => {
        const fetchMock = mockApi({
            "GET /reverse": reverseAnswer,
            "POST /api/places": { ...place, id: "place-9" },
        });
        renderPage();

        await fillBasicsAndPin();
        await next();
        await userEvent.type(await screen.findByLabelText("Cover image URL"), "https://images.example/bar.jpg");
        await userEvent.click(screen.getByRole("button", { name: "+ Add link" }));
        await userEvent.type(screen.getByRole("textbox", { name: "Instagram link" }), "newbar");
        await userEvent.click(screen.getByRole("button", { name: "Continue to review" }));

        expect(await screen.findByText("bar, terrace")).toBeInTheDocument();
        expect(screen.getByText("47.50000, 19.05000")).toBeInTheDocument();
        expect(screen.getByText("Instagram")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Create place" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.getByText("Place created.")).toBeInTheDocument();
        const postIndex = fetchMock.requests.findIndex((request) => request.method === "POST");
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

    it("keeps the pin and lets the address be typed when reverse geocoding fails", async () => {
        mockApi({ "GET /reverse": () => new Response("down", { status: 503 }) });
        renderPage();
        await userEvent.type(await screen.findByLabelText("Name"), "Bar");
        await next();
        await screen.findByRole("heading", { name: "Location" });

        act(() => {
            reactLeafletMock.fireMapEvent("click", { latlng: { lat: 47.5, lng: 19.05 } });
        });

        expect(await screen.findByText("Lat 47.50000 · Lng 19.05000")).toBeInTheDocument();
        expect(screen.getByLabelText("City")).toHaveValue("");
    });

    it("stays on the review with the backend's reason when the place is rejected", async () => {
        mockApi({
            "GET /reverse": reverseAnswer,
            "POST /api/places": () =>
                Response.json({ status: 400, detail: "Some fields are invalid." }, { status: 400 }),
        });
        renderPage();
        await fillBasicsAndPin();
        await next();
        await userEvent.click(await screen.findByRole("button", { name: "Continue to review" }));

        await userEvent.click(await screen.findByRole("button", { name: "Create place" }));

        expect(await screen.findByText("Some fields are invalid.")).toBeInTheDocument();
        expect(screen.queryByText("Place created.")).not.toBeInTheDocument();
    });
});
