import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PerformerInvitationRequest } from "@/api/types";
import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { EditPerformerPage } from "./EditPerformerPage";

const request: PerformerInvitationRequest = {
    eventPlanId: "plan-1",
    eventPlanTitle: "Summer Opening",
    state: "PENDING",
    startTime: "2030-07-01T20:00:00",
    endTime: "2030-07-01T22:00:00",
    performer,
};

function renderPage(auth = authenticatedSnapshot([Role.PERFORMER_MANAGER])) {
    return renderWithProviders(<EditPerformerPage />, {
        route: "/admin/performers/performer-1",
        path: "/admin/performers/:id",
        auth,
        dataRouter: true,
    });
}

describe("EditPerformerPage", () => {
    it("sends anonymous visitors to login", async () => {
        const { client } = renderWithProviders(<EditPerformerPage />, {
            route: "/admin/performers/performer-1",
            path: "/admin/performers/:id",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/performers/performer-1"));
    });

    it("shows the 404 page to other roles and for an unknown performer", async () => {
        mockApi({ "GET /api/performers/performer-1/invitations": [] });
        const { unmount } = renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();

        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: performer.name })).toBeInTheDocument();
    });

    it("saves an edited performer and stays", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": [],
            "PUT /api/performers/performer-1": performer,
        });
        renderPage();

        expect(await screen.findByRole("link", { name: "View public page" })).toHaveAttribute(
            "href",
            "/performers/performer-1",
        );
        await userEvent.clear(screen.getByLabelText("Genre"));
        await userEvent.type(screen.getByLabelText("Genre"), "acid");
        await userEvent.click(
            within(screen.getByRole("navigation", { name: "Form steps" })).getByRole("button", { name: /Review/ }),
        );
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("Performer saved.")).toBeInTheDocument();
        expect(
            requestBody(
                fetchMock,
                fetchMock.requests.findIndex((r) => r.method === "PUT"),
            ),
        ).toMatchObject({
            name: performer.name,
            genre: "acid",
        });
    });

    it("answers a lineup request", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": [request],
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=reject": null,
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Reject Summer Opening" }));

        expect(await screen.findByText("Invitation rejected.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "PUT")).toBe(true);
    });
});
