import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";

import { Role } from "@/auth/roles";
import { adminUser, adminUser2, adminUserPage } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

import { UsersPage } from "./UsersPage";

function Location() {
    const { search } = useLocation();
    return <output aria-label="search params">{search}</output>;
}

function renderPage(route = "/admin/platform/users", roles: Role[] = [Role.PARTYMAP_ADMIN]) {
    return renderWithProviders(
        <Routes>
            <Route
                path="/admin/platform/users"
                element={
                    <>
                        <UsersPage />
                        <Location />
                    </>
                }
            />
        </Routes>,
        { route, auth: authenticatedSnapshot(roles) },
    );
}

describe("UsersPage", () => {
    it("is not found for managers who are not platform admins", async () => {
        const fetchMock = mockApi({});
        renderPage(undefined, [Role.PLACE_MANAGER, Role.EVENT_ORGANIZER]);

        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("lists the users with their status and labelled roles", async () => {
        mockApi({ "GET /api/admin/users?page=0&size=20": adminUserPage });
        renderPage();

        const jane = await screen.findByRole("link", { name: /Jane Doe/ });
        expect(jane).toHaveAttribute("href", "/admin/platform/users/user-1");
        const rows = screen.getAllByRole("row");
        expect(within(rows[1]!).getByText("Active")).toBeInTheDocument();
        expect(within(rows[1]!).getByText("Place manager")).toBeInTheDocument();
        expect(within(rows[2]!).getByText("Disabled")).toBeInTheDocument();
        expect(within(rows[2]!).getByText("—")).toBeInTheDocument();
        expect(screen.queryByRole("navigation", { name: "Pages" })).not.toBeInTheDocument();
    });

    it("searches once typing pauses, from the first page, and keeps the search in each user's link", async () => {
        const fetchMock = mockApi({
            "GET /api/admin/users?page=2&size=20": { ...adminUserPage, page: 2, total: 60 },
            "GET /api/admin/users?q=jane&page=0&size=20": { items: [adminUser], total: 1, page: 0, size: 20 },
        });
        renderPage("/admin/platform/users?page=2");
        await screen.findByRole("link", { name: /Jane Doe/ });

        await userEvent.type(screen.getByRole("searchbox", { name: "Search users" }), "  jane ");

        await waitFor(() => expect(screen.getByRole("status", { name: "search params" })).toHaveTextContent("?q=jane"));
        expect(await screen.findByRole("link", { name: /Jane Doe/ })).toHaveAttribute(
            "href",
            "/admin/platform/users/user-1?q=jane",
        );
        expect(screen.queryByText("bob@example.com")).not.toBeInTheDocument();
        expect(fetchMock.requests.map((r) => r.url)).toContain("http://api.test/api/admin/users?q=jane&page=0&size=20");
    });

    it("clears the search when the box is emptied", async () => {
        mockApi({
            "GET /api/admin/users?q=jane&page=0&size=20": { items: [adminUser], total: 1, page: 0, size: 20 },
            "GET /api/admin/users?page=0&size=20": adminUserPage,
        });
        renderPage("/admin/platform/users?q=jane");
        expect(await screen.findByRole("searchbox", { name: "Search users" })).toHaveValue("jane");

        await userEvent.clear(screen.getByRole("searchbox", { name: "Search users" }));

        await waitFor(() => expect(screen.getByRole("status", { name: "search params" })).toHaveTextContent(/^$/));
        expect(await screen.findByRole("link", { name: /bob@example.com/ })).toBeInTheDocument();
    });

    it("pages through the users", async () => {
        mockApi({
            "GET /api/admin/users?page=0&size=20": { ...adminUserPage, total: 45 },
            "GET /api/admin/users?page=1&size=20": { items: [adminUser2], total: 45, page: 1, size: 20 },
        });
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Next" }));

        await waitFor(() => expect(screen.getByRole("status", { name: "search params" })).toHaveTextContent("?page=1"));
        expect(await screen.findByText("21–40 of 45")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Previous" }));
        await waitFor(() => expect(screen.getByRole("status", { name: "search params" })).toHaveTextContent(/^$/));
    });

    it("says when nothing matches", async () => {
        mockApi({ "GET /api/admin/users?q=zz&page=0&size=20": { items: [], total: 0, page: 0, size: 20 } });
        renderPage("/admin/platform/users?q=zz");
        expect(await screen.findByText("No user matches “zz”.")).toBeInTheDocument();
    });

    it("says when the realm has no users", async () => {
        mockApi({ "GET /api/admin/users?page=0&size=20": { items: [], total: 0, page: 0, size: 20 } });
        renderPage();
        expect(await screen.findByText("There are no users yet.")).toBeInTheDocument();
    });

    it("shows Keycloak's failure reason and retries", async () => {
        let calls = 0;
        mockApi({
            "GET /api/admin/users?page=0&size=20": () => {
                calls += 1;
                return calls === 1
                    ? Response.json(
                          { status: 502, detail: "The Keycloak admin client is not configured." },
                          { status: 502 },
                      )
                    : adminUserPage;
            },
        });
        renderPage();

        expect(await screen.findByText("The Keycloak admin client is not configured.")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("link", { name: /Jane Doe/ })).toBeInTheDocument();
    });
});
