import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { NavActions } from "./NavActions";

const linkNames = (nav: HTMLElement) =>
    within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent);

describe("NavActions", () => {
    describe("anonymous", () => {
        it("links to the map and the browse lists and offers a sign-in button that starts the login", async () => {
            const { client } = renderWithProviders(<NavActions variant="desktop" />);
            const button = await screen.findByRole("button", { name: "Sign in" });
            const nav = screen.getByRole("navigation", { name: "Main" });
            expect(nav).toHaveClass("nav", "desktop-nav");
            expect(button).toHaveClass("item", "desktop");
            expect(linkNames(nav)).toEqual(["Map", "Browse"]);
            expect(screen.getByRole("link", { name: "Map" })).toHaveAttribute("href", "/");
            expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/browse");

            await userEvent.click(button);
            expect(client.login).toHaveBeenCalledTimes(1);
            expect(client.login).toHaveBeenCalledWith("/");
        });

        it("uses the mobile classes", async () => {
            renderWithProviders(<NavActions variant="mobile" />);
            const button = await screen.findByRole("button", { name: "Sign in" });
            expect(screen.getByRole("navigation", { name: "Main" })).toHaveClass("nav", "mobile-nav");
            expect(button).toHaveClass("item", "mobile");
            expect(screen.getByRole("link", { name: "Map" })).toHaveClass("item", "mobile");
        });
    });

    describe("authenticated", () => {
        it("adds the profile and likes links and logs out", async () => {
            const { client } = renderWithProviders(<NavActions variant="desktop" />, { auth: authenticatedSnapshot() });
            const profile = await screen.findByRole("link", { name: "Profile" });
            expect(profile).toHaveAttribute("href", "/profile");
            expect(profile).toHaveClass("item", "desktop");
            expect(screen.getByRole("link", { name: "Likes" })).toHaveAttribute("href", "/profile/likes");
            expect(linkNames(screen.getByRole("navigation", { name: "Main" }))).toEqual([
                "Map",
                "Browse",
                "Profile",
                "Likes",
            ]);
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
            expect(screen.getByRole("link", { name: "Map" })).not.toHaveClass("active");
        });

        it("marks only the exact profile route as active", async () => {
            renderWithProviders(<NavActions variant="desktop" />, { auth: authenticatedSnapshot(), route: "/profile" });
            const profile = await screen.findByRole("link", { name: "Profile" });
            expect(profile).toHaveClass("active");
            expect(screen.getByRole("link", { name: "Likes" })).not.toHaveClass("active");
        });
    });

    it("marks the map link active only on the map and the browse link on every browse list", async () => {
        renderWithProviders(<NavActions variant="desktop" />, { route: "/browse/places?tag=ruin" });
        expect(await screen.findByRole("link", { name: "Browse" })).toHaveClass("active");
        expect(screen.getByRole("link", { name: "Map" })).not.toHaveClass("active");
    });

    it("can render only the explore links or only the account items", async () => {
        renderWithProviders(
            <>
                <NavActions variant="desktop" only="explore" />
                <NavActions variant="desktop" only="account" />
            </>,
            { auth: authenticatedSnapshot() },
        );
        const explore = await screen.findByRole("navigation", { name: "Explore" });
        expect(linkNames(explore)).toEqual(["Map", "Browse"]);
        expect(within(explore).queryByRole("button")).toBeNull();
        const account = screen.getByRole("navigation", { name: "Account" });
        expect(linkNames(account)).toEqual(["Profile", "Likes"]);
        expect(within(account).getByRole("button", { name: "Logout" })).toBeInTheDocument();
    });
});
