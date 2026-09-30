import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PerformerInvitationRequest } from "@/api/types";
import { Role } from "@/auth/roles";
import { formatDateTimeRange } from "@/lib/dates";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { EditPerformerPage } from "./EditPerformerPage";

const manager = authenticatedSnapshot([Role.PERFORMER_MANAGER]);
const request: PerformerInvitationRequest = {
    eventPlanId: "plan-1",
    performer,
    eventPlanTitle: "Summer Opening",
    state: "PENDING",
    startTime: "2030-07-01T22:00:00",
    endTime: "2030-07-02T00:00:00",
};

function renderPage(auth = manager) {
    return renderWithProviders(<EditPerformerPage />, {
        route: "/admin/performers/performer-1",
        path: "/admin/performers/:id",
        auth,
    });
}

describe("EditPerformerPage", () => {
    it("sends anonymous visitors to login", async () => {
        const fetchMock = mockApi({});
        const { client } = renderWithProviders(<EditPerformerPage />, {
            route: "/admin/performers/performer-1",
            path: "/admin/performers/:id",
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/performers/performer-1"));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows the 404 page to users without the performer manager role", async () => {
        mockApi({});
        renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when the invitations cannot be loaded", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": () => new Response("nope", { status: 500 }),
        });
        renderPage();
        expect(await screen.findByText("Could not load this performer.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    });

    it("prefills the form, including links and the image, next to the invitation requests", async () => {
        mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": [request],
        });
        renderPage();

        expect(await screen.findByRole("heading", { name: "Edit performer" })).toBeInTheDocument();
        expect(screen.getByLabelText("Name")).toHaveValue("DJ Test");
        expect(screen.getByLabelText("Genre")).toHaveValue("techno");
        expect(screen.getByLabelText("Bio")).toHaveValue("Plays records.");
        expect(screen.getByRole("combobox", { name: "Link type" })).toHaveValue("INSTAGRAM");
        expect(screen.getByRole("textbox", { name: "Instagram link" })).toHaveValue("djtest");
        expect(screen.getByLabelText("Profile image URL")).toHaveValue("https://images.example/dj.jpg");
        expect(screen.getByRole("img", { name: "Cover preview" })).toHaveAttribute(
            "src",
            "https://images.example/dj.jpg",
        );

        expect(screen.getByRole("heading", { name: "Event requests" })).toBeInTheDocument();
        expect(screen.getByText("Summer Opening")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText(formatDateTimeRange(request.startTime, request.endTime))).toBeInTheDocument();
    });

    it("saves the edited performer and opens its page", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": [],
            "PUT /api/performers/performer-1": performer,
        });
        renderPage();
        expect(await screen.findByRole("heading", { name: "Edit performer" })).toBeInTheDocument();

        await userEvent.clear(screen.getByLabelText("Genre"));
        await userEvent.type(screen.getByLabelText("Genre"), "minimal");
        await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.getByText("Performer saved.")).toBeInTheDocument();

        const putIndex = fetchMock.requests.findIndex((request) => request.method === "PUT");
        expect(fetchMock.requests[putIndex]?.url).toBe("http://api.test/api/performers/performer-1");
        expect(requestBody(fetchMock, putIndex)).toEqual({
            name: performer.name,
            genre: "minimal",
            bio: performer.bio,
            image: performer.image,
            links: performer.links,
        });
    });

    it("reloads the invitation requests after one is answered", async () => {
        let state: PerformerInvitationRequest["state"] = "PENDING";
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "GET /api/performers/performer-1/invitations": () => [{ ...request, state }],
            "PUT /api/performers/performer-1/invitations/plan-1/respond?state=reject": () => {
                state = "REJECTED";
                return null;
            },
        });
        renderPage();
        expect(await screen.findByText("Pending")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Reject" }));

        expect(await screen.findByText("Rejected")).toBeInTheDocument();
        expect(screen.getByText("Invitation rejected.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
        const respondCall = fetchMock.requests.find((request) => request.url.includes("/respond"));
        expect(respondCall?.url).toBe(
            "http://api.test/api/performers/performer-1/invitations/plan-1/respond?state=reject",
        );
        expect(respondCall?.method).toBe("PUT");
    });
});
