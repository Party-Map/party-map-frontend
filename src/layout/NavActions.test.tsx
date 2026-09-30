import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { NavActions } from "./NavActions";

describe("NavActions", () => {
    describe("anonymous", () => {
        it("offers a sign-in button that starts the login", async () => {
            const { client } = renderWithProviders(<NavActions variant="desktop" />);
            const button = await screen.findByRole("button", { name: "Sign in" });
            expect(screen.getByRole("navigation", { name: "Account" })).toHaveClass("nav", "desktopNav");
            expect(button).toHaveClass("item", "desktop");
            expect(screen.queryByRole("link")).toBeNull();

            await userEvent.click(button);
            expect(client.login).toHaveBeenCalledTimes(1);
            expect(client.login).toHaveBeenCalledWith("/");
        });

        it("uses the mobile classes", async () => {
            renderWithProviders(<NavActions variant="mobile" />);
            const button = await screen.findByRole("button", { name: "Sign in" });
            expect(screen.getByRole("navigation", { name: "Account" })).toHaveClass("nav", "mobileNav");
            expect(button).toHaveClass("item", "mobile");
        });
    });

    describe("authenticated", () => {
        it("links to the profile and likes and logs out", async () => {
            const { client } = renderWithProviders(<NavActions variant="desktop" />, { auth: authenticatedSnapshot() });
            const profile = await screen.findByRole("link", { name: "Profile" });
            expect(profile).toHaveAttribute("href", "/profile");
            expect(profile).toHaveClass("item", "desktop");
            expect(screen.getByRole("link", { name: "Likes" })).toHaveAttribute("href", "/profile/likes");
            expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();

            await userEvent.click(screen.getByRole("button", { name: "Logout" }));
            expect(client.logout).toHaveBeenCalledWith("/logged-out");
        });

        it("marks the likes link active on the likes page", async () => {
            renderWithProviders(<NavActions variant="mobile" />, {
                auth: authenticatedSnapshot(),
                route: "/profile/likes",
            });
            const likes = await screen.findByRole("link", { name: "Likes" });
            expect(likes).toHaveClass("item", "mobile", "active");
            expect(screen.getByRole("link", { name: "Profile" })).not.toHaveClass("active");
            expect(screen.getByRole("navigation", { name: "Account" })).toHaveClass("nav", "mobileNav");
        });

        it("marks only the exact profile route as active", async () => {
            renderWithProviders(<NavActions variant="desktop" />, { auth: authenticatedSnapshot(), route: "/profile" });
            const profile = await screen.findByRole("link", { name: "Profile" });
            expect(profile).toHaveClass("active");
            expect(screen.getByRole("link", { name: "Likes" })).not.toHaveClass("active");
        });
    });
});
