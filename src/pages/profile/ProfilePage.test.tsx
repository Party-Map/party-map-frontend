import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Role } from "@/auth/roles";
import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { ProfilePage } from "./ProfilePage";

describe("ProfilePage", () => {
    it("asks anonymous visitors to sign in", async () => {
        renderWithProviders(<ProfilePage />, { route: "/profile" });

        expect(await screen.findByRole("heading", { name: "Sign in required" })).toBeInTheDocument();
        expect(screen.getByText("You need to be signed in to view your profile.")).toBeInTheDocument();
    });

    it("shows a loading state while the session is checked", () => {
        renderWithProviders(<ProfilePage />, { authPending: true });

        expect(screen.getByRole("status")).toHaveTextContent("Checking your session…");
    });

    it("shows initials, name, email, name fields and the account console link", async () => {
        renderWithProviders(<ProfilePage />, { auth: authenticatedSnapshot() });

        expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
        expect(screen.getByText("TU")).toBeInTheDocument();
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("Given name")).toBeInTheDocument();
        expect(screen.getByText("Test")).toBeInTheDocument();
        expect(screen.getByText("Family name")).toBeInTheDocument();
        expect(screen.getByText("User")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Edit profile" })).toHaveAttribute(
            "href",
            "http://kc.test/account?returnTo=%2Fprofile",
        );
        expect(screen.queryByRole("link", { name: "Admin page" })).not.toBeInTheDocument();
    });

    it("offers the admin page to admins", async () => {
        renderWithProviders(<ProfilePage />, { auth: authenticatedSnapshot([Role.PLACE_MANAGER]) });

        expect(await screen.findByRole("link", { name: "Admin page" })).toHaveAttribute("href", "/admin");
    });

    it("falls back to placeholders for an incomplete profile", async () => {
        renderWithProviders(<ProfilePage />, {
            auth: {
                authenticated: true,
                roles: ["user"],
                user: { name: "", email: null, givenName: null, familyName: null },
            },
        });

        expect(await screen.findByText("?")).toBeInTheDocument();
        expect(screen.getByText("Not provided")).toBeInTheDocument();
        expect(screen.getAllByText("—")).toHaveLength(2);
    });

    it("names an unknown user when the token carries no profile", async () => {
        renderWithProviders(<ProfilePage />, { auth: { authenticated: true, roles: ["user"], user: null } });

        expect(await screen.findByText("Unknown user")).toBeInTheDocument();
        expect(screen.getByText("UU")).toBeInTheDocument();
    });
});
