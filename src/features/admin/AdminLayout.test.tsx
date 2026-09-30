import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";

import type { AuthSnapshot } from "@/lib/auth/keycloak";
import { Role } from "@/lib/auth/roles";
import { authenticatedSnapshot, type MockAuthClient, renderWithProviders } from "@/test/helpers";

import { AdminLayout } from "./AdminLayout";

function renderLayout(options: { auth?: AuthSnapshot; authPending?: boolean; route?: string } = {}): {
    client: MockAuthClient;
} {
    return renderWithProviders(
        <Routes>
            <Route path="/admin" element={<AdminLayout />}>
                <Route path="places" element={<p>places content</p>} />
                <Route path="performers" element={<p>performers content</p>} />
            </Route>
        </Routes>,
        { route: "/admin/places", ...options },
    );
}

describe("AdminLayout", () => {
    it("shows a loading state while the session is being checked", () => {
        renderLayout({ authPending: true });
        expect(screen.getByText("Checking your access…")).toBeInTheDocument();
    });

    it("asks anonymous visitors to sign in and returns them to /admin", async () => {
        const { client } = renderLayout();
        expect(await screen.findByText("Sign in required")).toBeInTheDocument();
        expect(screen.getByText("You need to be signed in to view your Admin page.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Go to login" }));
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin"));
    });

    it("turns away signed-in users without an admin role", async () => {
        renderLayout({ auth: authenticatedSnapshot() });
        expect(await screen.findByText("You have no access to the admin page.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Go to Profile" })).toHaveAttribute("href", "/profile");
        expect(screen.queryByText("places content")).not.toBeInTheDocument();
    });

    it("renders the section without tabs when the user manages a single area", async () => {
        renderLayout({ auth: authenticatedSnapshot([Role.PLACE_MANAGER]) });
        expect(await screen.findByText("places content")).toBeInTheDocument();
        expect(screen.queryByRole("navigation", { name: "Admin sections" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to Map" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Admin Panel" })).toHaveAttribute("href", "/admin");
    });

    it("renders one tab per managed area and marks the current one", async () => {
        renderLayout({ auth: authenticatedSnapshot([Role.PLACE_MANAGER, Role.PERFORMER_MANAGER]) });
        expect(await screen.findByText("places content")).toBeInTheDocument();

        const tabs = screen.getByRole("navigation", { name: "Admin sections" });
        const placesTab = screen.getByRole("link", { name: "Manage your Places" });
        const performersTab = screen.getByRole("link", { name: "Manage your Performers" });
        expect(tabs).toContainElement(placesTab);
        expect(tabs).toContainElement(performersTab);
        expect(screen.queryByRole("link", { name: "Manage your Events" })).not.toBeInTheDocument();
        expect(placesTab).toHaveClass("tabActive");
        expect(performersTab).not.toHaveClass("tabActive");

        await userEvent.click(performersTab);
        expect(await screen.findByText("performers content")).toBeInTheDocument();
        expect(performersTab).toHaveClass("tabActive");
    });
});
