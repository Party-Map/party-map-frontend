import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";

import { useAuth } from "@/lib/auth/AuthProvider";
import { Role } from "@/lib/auth/roles";
import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { AdminIndexPage } from "./AdminIndexPage";

function AuthStatus() {
    return <span>auth: {useAuth().status}</span>;
}

function renderIndex(roles: Role[]) {
    return renderWithProviders(
        <>
            <AuthStatus />
            <Routes>
                <Route path="/admin" element={<AdminIndexPage />} />
                <Route path="/admin/places" element={<p>places section</p>} />
                <Route path="/admin/performers" element={<p>performers section</p>} />
            </Routes>
        </>,
        { route: "/admin", auth: authenticatedSnapshot(roles) },
    );
}

describe("AdminIndexPage", () => {
    it("redirects to the first section the user may manage", async () => {
        renderIndex([Role.PERFORMER_MANAGER, Role.EVENT_ORGANIZER]);
        expect(await screen.findByText("performers section")).toBeInTheDocument();
    });

    it("prefers the places section when the user manages places too", async () => {
        renderIndex([Role.EVENT_ORGANIZER, Role.PLACE_MANAGER]);
        expect(await screen.findByText("places section")).toBeInTheDocument();
    });

    it("renders nothing for users without an admin section", async () => {
        renderIndex([]);
        expect(await screen.findByText("auth: authenticated")).toBeInTheDocument();
        expect(screen.queryByText(/section$/)).not.toBeInTheDocument();
    });
});
