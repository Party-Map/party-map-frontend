import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PlaceInvitationRequest } from "@/api/types";
import { Role } from "@/auth/roles";
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
    return renderWithProviders(<EditPlacePage />, {
        route: "/admin/places/place-1",
        path: "/admin/places/:id",
        auth,
        dataRouter: true,
    });
}

describe("EditPlacePage", () => {
    beforeEach(() => fakeMap.reset());

    it("sends anonymous visitors to login without loading anything", async () => {
        const fetchMock = mockApi({});
        const { client } = renderWithProviders(<EditPlacePage />, {
            route: "/admin/places/place-1",
            path: "/admin/places/:id",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/places/place-1"));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows the 404 page to users without the place manager role", async () => {
        mockApi({});
        renderPage(authenticatedSnapshot([Role.PERFORMER_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows the 404 page for an unknown place", async () => {
        mockApi({ "GET /api/places/place-1/invitations": [] });
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/place-1": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : place;
            },
            "GET /api/places/place-1/invitations": [],
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
    });

    it("opens any step of the prefilled place and saves the change without leaving", async () => {
        const fetchMock = mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": [],
            "PUT /api/places/place-1": place,
        });
        renderPage();

        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "View public page" })).toHaveAttribute("href", "/places/place-1");
        expect(screen.getByLabelText("Name")).toHaveValue(place.name);
        const steps = screen.getByRole("navigation", { name: "Form steps" });
        await userEvent.click(within(steps).getByRole("button", { name: /Image & links/ }));
        expect(screen.getByLabelText("Cover image URL")).toHaveValue(place.image);

        await userEvent.click(within(steps).getByRole("button", { name: /Basics/ }));
        await userEvent.clear(screen.getByLabelText("Name"));
        await userEvent.type(screen.getByLabelText("Name"), "A38 Ship");
        await userEvent.click(within(steps).getByRole("button", { name: /Review/ }));
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("Place saved.")).toBeInTheDocument();
        const put = fetchMock.requests.findIndex((r) => r.method === "PUT");
        expect(requestBody(fetchMock, put)).toMatchObject({ name: "A38 Ship", tags: place.tags, links: place.links });
        expect(screen.queryByText("other page")).not.toBeInTheDocument();
    });

    it("lists the event requests and reloads them after an answer", async () => {
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
        expect(await screen.findByRole("heading", { name: "Event requests" })).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening" }));

        expect(await screen.findByText("Accepted")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Accept Summer Opening" })).toBeDisabled();
        expect(fetchMock.requests.find((r) => r.url.includes("/respond"))?.method).toBe("PUT");
    });

    it("explains when there are no requests", async () => {
        mockApi({ "GET /api/places/place-1": place, "GET /api/places/place-1/invitations": [] });
        renderPage();
        expect(await screen.findByText("No event requests for this place at the moment.")).toBeInTheDocument();
    });
});
