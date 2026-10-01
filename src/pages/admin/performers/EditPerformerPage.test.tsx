import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { EditPerformerPage } from "./EditPerformerPage";

function renderPage(auth = authenticatedSnapshot([Role.PERFORMER_MANAGER])) {
    return renderWithProviders(<EditPerformerPage />, {
        route: "/admin/performers/performer-1/edit",
        path: "/admin/performers/:id/edit",
        auth,
        dataRouter: true,
    });
}

describe("EditPerformerPage", () => {
    it("sends anonymous visitors to login", async () => {
        const { client } = renderWithProviders(<EditPerformerPage />, {
            route: "/admin/performers/performer-1/edit",
            path: "/admin/performers/:id/edit",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/performers/performer-1/edit"));
    });

    it("shows the 404 page to other roles and for an unknown performer", async () => {
        mockApi({});
        const { unmount } = renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
        unmount();
        renderPage();
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows an error with a retry action when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/performers/performer-1": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : performer;
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: "Details" })).toBeInTheDocument();
    });

    it("saves an edited performer and stays", async () => {
        const fetchMock = mockApi({
            "GET /api/performers/performer-1": performer,
            "PUT /api/performers/performer-1": performer,
        });
        renderPage();

        expect(await screen.findByRole("link", { name: /View public page/ })).toHaveAttribute("target", "_blank");
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
});
