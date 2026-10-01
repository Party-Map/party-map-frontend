import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";

import { Role } from "@/auth/roles";
import { ANONYMOUS, authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { AdminShell } from "./AdminShell";

function renderShell(route: string, roles: Role[] | null, options: { authPending?: boolean } = {}) {
    return renderWithProviders(
        <Routes>
            <Route path="/admin" element={<AdminShell />}>
                <Route path="places" element={<p>places overview</p>} />
                <Route path="places/list" element={<p>places list</p>} />
                <Route path="events" element={<p>events overview</p>} />
                <Route path="events/plans/:id" element={<p>plan workspace</p>} />
            </Route>
            <Route path="/" element={<p>the map</p>} />
        </Routes>,
        {
            route,
            auth: roles ? authenticatedSnapshot(roles, "Jane Doe") : ANONYMOUS,
            authPending: options.authPending ?? false,
        },
    );
}

describe("AdminShell", () => {
    it("waits for the session before deciding anything", () => {
        renderShell("/admin/places", [Role.PLACE_MANAGER], { authPending: true });

        expect(screen.getByText("Checking your access…")).toBeInTheDocument();
        expect(screen.queryByText("places overview")).not.toBeInTheDocument();
    });

    it("asks anonymous visitors to sign in and brings them back to the same page", async () => {
        const { client } = renderShell("/admin/events/plans/p1?step=2", null);

        await userEvent.click(await screen.findByRole("button", { name: "Go to login" }));

        expect(client.login).toHaveBeenCalledWith("/admin/events/plans/p1?step=2");
        expect(screen.queryByText("plan workspace")).not.toBeInTheDocument();
    });

    it("tells signed-in users without an admin role that they have no access", async () => {
        renderShell("/admin/places", []);

        expect(
            await screen.findByRole("heading", { name: "You have no access to the admin area" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Go to Profile" })).toHaveAttribute("href", "/profile");
    });

    it("frames the page with the header, the domain's sections and no public bottom bar", async () => {
        renderShell("/admin/places/list", [Role.PLACE_MANAGER]);

        expect(await screen.findByText("places list")).toBeInTheDocument();
        const nav = screen.getAllByRole("navigation", { name: "Admin sections" })[0]!;
        expect(within(nav).getByRole("link", { name: "My places" })).toHaveAttribute("aria-current", "page");
        expect(within(nav).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
        expect(within(nav).getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("main")).toHaveAttribute("id", "admin-main");
        expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#admin-main");
        expect(screen.getByRole("link", { name: "PartyMap: back to the map" })).toHaveAttribute("href", "/");
        expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
        // One domain: a label, nothing to switch.
        expect(screen.queryByRole("button", { name: /Switch domain/ })).not.toBeInTheDocument();
    });

    it("switches between the domains the user's roles unlock", async () => {
        renderShell("/admin/places", [Role.PLACE_MANAGER, Role.EVENT_ORGANIZER]);

        await userEvent.click(await screen.findByRole("button", { name: "Admin domain: Places. Switch domain" }));
        const items = await screen.findAllByRole("menuitem");
        expect(items.map((item) => item.textContent)).toEqual([
            expect.stringContaining("Places"),
            expect.stringContaining("Events"),
        ]);
        expect(items[0]).toHaveAttribute("aria-current", "page");

        await userEvent.click(items[1]!);

        expect(await screen.findByText("events overview")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Admin domain: Events. Switch domain" })).toBeInTheDocument();
    });

    it("opens the sections in a drawer on phones and closes it after navigating", async () => {
        renderShell("/admin/places", [Role.PLACE_MANAGER]);

        await userEvent.click(await screen.findByRole("button", { name: "Open navigation" }));
        const drawer = await screen.findByRole("dialog", { name: "Navigation" });
        await userEvent.click(within(drawer).getByRole("link", { name: "My places" }));

        expect(await screen.findByText("places list")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument());
    });

    it("closes the drawer with its close button", async () => {
        renderShell("/admin/places", [Role.PLACE_MANAGER]);

        await userEvent.click(await screen.findByRole("button", { name: "Open navigation" }));
        await userEvent.click(await screen.findByRole("button", { name: "Close navigation" }));

        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument());
    });

    it("shows a domain-less sidebar outside the known domains", async () => {
        renderWithProviders(
            <Routes>
                <Route path="/admin" element={<AdminShell />}>
                    <Route path="*" element={<p>somewhere else</p>} />
                </Route>
            </Routes>,
            { route: "/admin/unknown", auth: authenticatedSnapshot([Role.PLACE_MANAGER]) },
        );

        expect(await screen.findByText("somewhere else")).toBeInTheDocument();
        // The switcher falls back to the user's first domain.
        expect(screen.getByText("Places")).toBeInTheDocument();
        const nav = screen.getByRole("navigation", { name: "Admin sections" });
        expect(within(nav).queryByRole("link", { name: "Overview" })).not.toBeInTheDocument();
    });
});
