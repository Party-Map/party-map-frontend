import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { PerformersListPage } from "./PerformersListPage";

function renderPage(roles: Role[] = [Role.PERFORMER_MANAGER]) {
    return renderWithProviders(<PerformersListPage />, { auth: authenticatedSnapshot(roles) });
}

describe("PerformersListPage", () => {
    it("is not found for users who do not manage performers", async () => {
        mockApi({});
        renderPage([]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("lists the owned performers with their genre", async () => {
        mockApi({
            "GET /api/performers/owned-performers": [
                { id: performer.id, name: performer.name },
                { id: "new", name: "Brand New" },
            ],
            "GET /api/performers": [performer],
        });
        renderPage();

        expect(await screen.findByRole("link", { name: "DJ Test" })).toHaveAttribute(
            "href",
            "/admin/performers/performer-1",
        );
        expect(screen.getByText("techno")).toBeInTheDocument();
        expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("explains an empty list", async () => {
        mockApi({ "GET /api/performers/owned-performers": [], "GET /api/performers": [] });
        renderPage();
        expect(await screen.findByText(/You do not represent any performers yet/)).toBeInTheDocument();
    });

    it("offers a retry when loading fails", async () => {
        let calls = 0;
        mockApi({
            "GET /api/performers/owned-performers": [],
            "GET /api/performers": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : [];
            },
        });
        renderPage();
        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByText(/You do not represent any performers yet/)).toBeInTheDocument();
    });
});
