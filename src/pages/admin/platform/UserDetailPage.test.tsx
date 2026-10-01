import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AdminUser } from "@/api/types";
import { Role } from "@/auth/roles";
import { adminUser, adminUser2 } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { UserDetailPage } from "./UserDetailPage";

function renderPage(route = "/admin/platform/users/user-1", roles: Role[] = [Role.PARTYMAP_ADMIN]) {
    return renderWithProviders(<UserDetailPage />, {
        route,
        path: "/admin/platform/users/:id",
        auth: authenticatedSnapshot(roles),
    });
}

describe("UserDetailPage", () => {
    it("is not found for managers who are not platform admins", async () => {
        mockApi({});
        renderPage(undefined, [Role.PLACE_MANAGER]);
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows the account and one switch per manager role", async () => {
        mockApi({ "GET /api/admin/users/user-1": adminUser });
        renderPage("/admin/platform/users/user-1?q=jane&page=1");

        expect(await screen.findByRole("heading", { level: 1, name: "Jane Doe" })).toBeInTheDocument();
        const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
        expect(within(crumbs).getByRole("link", { name: "Users" })).toHaveAttribute(
            "href",
            "/admin/platform/users?q=jane&page=1",
        );
        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: "Place manager" })).toBeChecked();
        expect(screen.getByRole("switch", { name: "Performer manager" })).not.toBeChecked();
        expect(screen.getByRole("switch", { name: "Event organizer" })).not.toBeChecked();
        expect(screen.queryByText("Platform admin")).not.toBeInTheDocument();
    });

    it("shows a disabled account without an email and its platform admin role read-only", async () => {
        const admin: AdminUser = { ...adminUser2, roles: ["partymap_admin"] };
        mockApi({ "GET /api/admin/users/user-2": admin });
        renderPage("/admin/platform/users/user-2");

        expect(await screen.findByRole("heading", { level: 1, name: "bob@example.com" })).toBeInTheDocument();
        expect(screen.getByText("Disabled")).toBeInTheDocument();
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.getByText("Platform admin")).toBeInTheDocument();
        expect(screen.getByText("Granted and revoked in Keycloak only.")).toBeInTheDocument();
        expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toContainElement(
            screen.getByRole("link", { name: "Users" }),
        );
        expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/admin/platform/users");
    });

    it("grants a role after confirming and refreshes the user", async () => {
        let roles = ["place_manager_user"];
        const fetchMock = mockApi({
            "GET /api/admin/users/user-1": () => ({ ...adminUser, roles }),
            "PUT /api/admin/users/user-1/roles/event_organizer_user": () => {
                roles = [...roles, "event_organizer_user"];
                return null;
            },
        });
        renderPage();

        await userEvent.click(await screen.findByRole("switch", { name: "Event organizer" }));
        const dialog = await screen.findByRole("alertdialog", { name: "Grant Event organizer?" });
        expect(dialog).toHaveTextContent(
            "Jane Doe will be able to plan events, invite places and performers, and publish events to the map.",
        );
        await userEvent.click(within(dialog).getByRole("button", { name: "Grant role" }));

        expect(await screen.findByText("Event organizer granted to Jane Doe.")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole("switch", { name: "Event organizer" })).toBeChecked());
        expect(fetchMock.requests.filter((r) => r.method === "PUT")).toHaveLength(1);
    });

    it("revokes a role after confirming", async () => {
        const fetchMock = mockApi({
            "GET /api/admin/users/user-1": adminUser,
            "DELETE /api/admin/users/user-1/roles/place_manager_user": null,
        });
        renderPage();

        await userEvent.click(await screen.findByRole("switch", { name: "Place manager" }));
        const dialog = await screen.findByRole("alertdialog", { name: "Revoke Place manager?" });
        expect(dialog).toHaveTextContent("Jane Doe will no longer be able to create and edit places");
        await userEvent.click(within(dialog).getByRole("button", { name: "Revoke role" }));

        expect(await screen.findByText("Place manager revoked from Jane Doe.")).toBeInTheDocument();
        expect(fetchMock.requests.some((r) => r.method === "DELETE")).toBe(true);
    });

    it("changes nothing when the confirmation is cancelled", async () => {
        const fetchMock = mockApi({ "GET /api/admin/users/user-1": adminUser });
        renderPage();

        await userEvent.click(await screen.findByRole("switch", { name: "Performer manager" }));
        await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));

        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
        expect(screen.getByRole("switch", { name: "Performer manager" })).not.toBeChecked();
        expect(fetchMock.requests.every((r) => r.method === "GET")).toBe(true);
    });

    it("reports a failed change", async () => {
        mockApi({
            "GET /api/admin/users/user-1": adminUser,
            "PUT /api/admin/users/user-1/roles/performer_manager_user": Response.json(
                { status: 502, detail: "Keycloak did not answer as expected." },
                { status: 502 },
            ),
        });
        renderPage();

        await userEvent.click(await screen.findByRole("switch", { name: "Performer manager" }));
        await userEvent.click(await screen.findByRole("button", { name: "Grant role" }));

        expect(await screen.findByText("Keycloak did not answer as expected.")).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: "Performer manager" })).not.toBeChecked();
    });

    it("is not found for an unknown user", async () => {
        mockApi({});
        renderPage("/admin/platform/users/nobody");
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("shows the failure reason and retries", async () => {
        let calls = 0;
        mockApi({
            "GET /api/admin/users/user-1": () => {
                calls += 1;
                return calls === 1 ? new Response("boom", { status: 500 }) : adminUser;
            },
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("heading", { level: 1, name: "Jane Doe" })).toBeInTheDocument();
    });
});
