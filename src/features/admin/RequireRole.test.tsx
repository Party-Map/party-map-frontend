import { screen, waitFor } from "@testing-library/react";

import { Role } from "@/lib/auth/roles";
import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { RequireRole } from "./RequireRole";

const guarded = (
    <RequireRole role={Role.PLACE_MANAGER}>
        <p>secret content</p>
    </RequireRole>
);

describe("RequireRole", () => {
    it("shows a loading state while the session is being checked", () => {
        renderWithProviders(guarded, { authPending: true });
        expect(screen.getByText("Checking your access…")).toBeInTheDocument();
        expect(screen.queryByText("secret content")).not.toBeInTheDocument();
    });

    it("sends anonymous visitors to login and returns them to the current URL", async () => {
        const { client } = renderWithProviders(guarded, { route: "/admin/places?tab=1", path: "/admin/places" });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/places?tab=1"));
        expect(screen.queryByText("secret content")).not.toBeInTheDocument();
    });

    it("renders the 404 page for signed-in users without the role", async () => {
        const { client } = renderWithProviders(guarded, { auth: authenticatedSnapshot([Role.PERFORMER_MANAGER]) });
        expect(await screen.findByText("404")).toBeInTheDocument();
        expect(screen.queryByText("secret content")).not.toBeInTheDocument();
        expect(client.login).not.toHaveBeenCalled();
    });

    it("renders the children for users with the role", async () => {
        renderWithProviders(guarded, { auth: authenticatedSnapshot([Role.PLACE_MANAGER]) });
        expect(await screen.findByText("secret content")).toBeInTheDocument();
        expect(screen.queryByText("404")).not.toBeInTheDocument();
    });
});
