import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PlaceInvitationRequest } from "@/api/types";
import { Role } from "@/auth/roles";
import { formatDateTimeRange } from "@/lib/dates";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";
import { fakeMap } from "@/test/mocks/leaflet";

import { EditPlacePage } from "./EditPlacePage";

vi.mock("react-leaflet", () => import("@/test/mocks/leaflet").then((m) => m.reactLeafletMock));
vi.mock("leaflet", () => import("@/test/mocks/leaflet").then((m) => m.leafletMock));

const manager = authenticatedSnapshot([Role.PLACE_MANAGER]);
const request: PlaceInvitationRequest = {
    eventPlanId: "plan-1",
    state: "PENDING",
    title: "Summer Opening",
    startDateTime: "2030-07-01T18:00:00",
    endDateTime: "2030-07-02T02:00:00",
};

function renderPage(auth = manager) {
    return renderWithProviders(<EditPlacePage />, { route: "/admin/places/place-1", path: "/admin/places/:id", auth });
}

describe("EditPlacePage", () => {
    beforeEach(() => fakeMap.reset());

    it("sends anonymous visitors to login", async () => {
        const fetchMock = mockApi({});
        const { client } = renderWithProviders(<EditPlacePage />, {
            route: "/admin/places/place-1",
            path: "/admin/places/:id",
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/places/place-1"));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows the 404 page to users without the place manager role", async () => {
        mockApi({});
        renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when the place cannot be loaded", async () => {
        const fetchMock = mockApi({
            "GET /api/places/place-1": () => new Response("missing", { status: 404 }),
            "GET /api/places/place-1/invitations": [],
        });
        renderPage();
        expect(await screen.findByText("Could not load this place.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    });

    it("prefills the form, including links and the image, next to the invitation requests", async () => {
        mockApi({ "GET /api/places/place-1": place, "GET /api/places/place-1/invitations": [request] });
        renderPage();

        expect(await screen.findByRole("heading", { name: "Edit place" })).toBeInTheDocument();
        expect(screen.getByLabelText("Name")).toHaveValue("A38 Hajó");
        expect(screen.getByLabelText("Address")).toHaveValue("Petőfi híd budai hídfő");
        expect(screen.getByLabelText("City")).toHaveValue("Budapest");
        expect(screen.getByLabelText("Description")).toHaveValue("Concert ship on the Danube.");
        expect(screen.getByLabelText("Tags")).toHaveValue("concert, ship, techno");
        expect(screen.getByText("Lat: 47.47710 · Lng: 19.06210")).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Link type" })).toHaveValue("WEBSITE");
        expect(screen.getByRole("textbox", { name: "Website link" })).toHaveValue("a38.hu");
        expect(screen.getByLabelText("Cover image URL")).toHaveValue("https://images.example/a38.jpg");
        expect(screen.getByRole("img", { name: "Cover preview" })).toHaveAttribute(
            "src",
            "https://images.example/a38.jpg",
        );

        expect(screen.getByRole("heading", { name: "Event requests" })).toBeInTheDocument();
        expect(screen.getByText("Summer Opening")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText(formatDateTimeRange(request.startDateTime, request.endDateTime))).toBeInTheDocument();
    });

    it("saves the edited place and opens its page", async () => {
        const fetchMock = mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": [],
            "PUT /api/places/place-1": place,
        });
        renderPage();
        expect(await screen.findByRole("heading", { name: "Edit place" })).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText("Name"), " Renamed");
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.getByText("Place saved.")).toBeInTheDocument();

        const putIndex = fetchMock.mock.calls.findIndex(
            ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
        );
        expect(String(fetchMock.mock.calls[putIndex]?.[0])).toBe("http://api.test/api/places/place-1");
        expect(requestBody(fetchMock, putIndex)).toEqual({
            name: "A38 Hajó Renamed",
            address: place.address,
            city: place.city,
            location: place.location,
            description: place.description,
            tags: place.tags,
            image: place.image,
            links: place.links,
        });
    });

    it("reloads the invitation requests after one is answered", async () => {
        let state: PlaceInvitationRequest["state"] = "PENDING";
        const fetchMock = mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": () => [{ ...request, state }],
            "PUT /api/places/place-1/invitations/plan-1/respond?state=accept": () => {
                state = "ACCEPTED";
                return null;
            },
        });
        renderPage();
        expect(await screen.findByText("Pending")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Accept" }));

        expect(await screen.findByText("Accepted")).toBeInTheDocument();
        expect(screen.getByText("Invitation accepted.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
        const respondCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/respond"));
        expect(String(respondCall?.[0])).toBe(
            "http://api.test/api/places/place-1/invitations/plan-1/respond?state=accept",
        );
        expect((respondCall?.[1] as RequestInit | undefined)?.method).toBe("PUT");
    });
});
