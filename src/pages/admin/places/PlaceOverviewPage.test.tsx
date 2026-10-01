import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PlaceInvitationRequest } from "@/api/types";
import { Role } from "@/auth/roles";
import { place } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PlaceOverviewPage } from "./PlaceOverviewPage";

const request = (eventPlanId: string, title: string, state: PlaceInvitationRequest["state"]) => ({
    eventPlanId,
    title,
    state,
    startDateTime: "2030-07-01T18:00:00",
    endDateTime: "2030-07-02T02:00:00",
});

function renderPage(auth = authenticatedSnapshot([Role.PLACE_MANAGER])) {
    return renderWithProviders(<PlaceOverviewPage />, {
        route: "/admin/places/place-1",
        path: "/admin/places/:id",
        auth,
    });
}

describe("PlaceOverviewPage", () => {
    it("shows the 404 page to other roles and for an unknown place", async () => {
        mockApi({ "GET /api/places/place-1/invitations": [] });
        const { unmount } = renderPage(authenticatedSnapshot([Role.EVENT_ORGANIZER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("counts the requests, lists the waiting ones and shows the public profile", async () => {
        let state: PlaceInvitationRequest["state"] = "PENDING";
        mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": () => [
                request("plan-1", "Summer Opening", state),
                request("plan-2", "Jazz Night", "ACCEPTED"),
                request("plan-3", "Rave", "REJECTED"),
            ],
            "PUT /api/places/place-1/invitations/plan-1/respond?state=accept": () => {
                state = "ACCEPTED";
                return null;
            },
        });
        renderPage();

        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
        expect(screen.getByText(`${place.address}, ${place.city}`)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Waiting for your answer\s*1/ })).toHaveAttribute(
            "href",
            "/admin/places/place-1/requests",
        );
        expect(screen.getByRole("link", { name: /View public page/ })).toHaveAttribute("target", "_blank");
        expect(screen.getByRole("link", { name: "Edit details" })).toHaveAttribute(
            "href",
            "/admin/places/place-1/edit",
        );
        const profile = screen.getByRole("region", { name: "Public profile" });
        expect(within(profile).getByText(place.description!)).toBeInTheDocument();
        expect(within(profile).getByText("techno")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening" }));

        expect(await screen.findByText("Nothing is waiting for your answer.")).toBeInTheDocument();
    });

    it("explains an empty profile", async () => {
        mockApi({
            "GET /api/places/place-1": { ...place, description: null, image: null, tags: [], links: [] },
            "GET /api/places/place-1/invitations": [],
        });
        renderPage();
        expect(await screen.findByText(/No description yet/)).toBeInTheDocument();
    });

    it("shows an error with a retry action when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/place-1": place,
            "GET /api/places/place-1/invitations": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: place.name })).toBeInTheDocument();
    });
});
