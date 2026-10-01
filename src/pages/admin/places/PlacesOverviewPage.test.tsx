import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PlaceInvitationRequest, PlaceListItem } from "@/api/types";
import { Role } from "@/auth/roles";
import { place, place2 } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PlacesOverviewPage } from "./PlacesOverviewPage";

const owned: PlaceListItem[] = [place, place2].map(({ id, name, address, city }) => ({ id, name, address, city }));
const request = (eventPlanId: string, title: string, state: PlaceInvitationRequest["state"]) => ({
    eventPlanId,
    title,
    state,
    startDateTime: "2030-07-01T18:00:00",
    endDateTime: "2030-07-02T02:00:00",
});

function renderPage(roles: Role[] = [Role.PLACE_MANAGER]) {
    return renderWithProviders(<PlacesOverviewPage />, { route: "/admin/places", auth: authenticatedSnapshot(roles) });
}

describe("PlacesOverviewPage", () => {
    it("is not found for users who do not manage places", async () => {
        const fetchMock = mockApi({});
        renderPage([Role.EVENT_ORGANIZER]);

        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("counts the places and the requests and lists the pending ones across places", async () => {
        let answered = false;
        const fetchMock = mockApi({
            "GET /api/places/owned-places": owned,
            "GET /api/places/place-1/invitations": () => [
                request("plan-1", "Summer Opening", answered ? "ACCEPTED" : "PENDING"),
                request("plan-2", "Jazz Night", "ACCEPTED"),
            ],
            "GET /api/places/place-2/invitations": [request("plan-3", "Rave", "REJECTED")],
            "PUT /api/places/place-1/invitations/plan-1/respond?state=accept": () => {
                answered = true;
                return null;
            },
        });
        renderPage();

        expect(await screen.findByRole("link", { name: /Places\s*2/ })).toHaveAttribute("href", "/admin/places/list");
        expect(screen.getByRole("link", { name: /Waiting for your answer\s*1/ })).toHaveAttribute(
            "href",
            "/admin/places/requests",
        );
        expect(screen.getByText("Accepted events").parentElement?.parentElement).toHaveTextContent("1");
        expect(screen.getByRole("heading", { name: "Summer Opening" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Jazz Night" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "New place" })).toHaveAttribute("href", "/admin/places/new");

        await userEvent.click(screen.getByRole("button", { name: "Accept Summer Opening for A38 Hajó" }));

        expect(await screen.findByText("Nothing is waiting for your answer.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
    });

    it("offers a retry when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/places/owned-places": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Nothing is waiting for your answer.")).toBeInTheDocument();
        expect(calls).toBe(2);
    });
});
