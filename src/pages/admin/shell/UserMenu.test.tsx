import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

import { initials, UserMenu } from "./UserMenu";

describe("initials", () => {
    it("takes the first and last name's first letters", () => {
        expect(initials("Jane Doe")).toBe("JD");
        expect(initials("adrián bence széll")).toBe("AS");
        expect(initials("Madonna")).toBe("M");
        expect(initials("  ")).toBe("?");
    });
});

describe("UserMenu", () => {
    it("offers the user's pages, the account console and logging out", async () => {
        const { client } = renderWithProviders(<UserMenu />, {
            route: "/admin/places",
            auth: authenticatedSnapshot([], "Jane Doe"),
        });

        await userEvent.click(await screen.findByRole("button", { name: "Account menu for Jane Doe" }));

        expect(await screen.findByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute("href", "/profile");
        expect(screen.getByRole("menuitem", { name: "Likes" })).toHaveAttribute("href", "/profile/likes");
        expect(screen.getByRole("menuitem", { name: "Account settings" })).toHaveAttribute(
            "href",
            "http://kc.test/account?returnTo=%2Fadmin%2Fplaces",
        );

        await userEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
        expect(client.logout).toHaveBeenCalled();
    });

    it("has a generic label before the profile is known", async () => {
        renderWithProviders(<UserMenu />, { auth: { authenticated: true, roles: ["user"], user: null } });

        await userEvent.click(await screen.findByRole("button", { name: "Account menu for Account" }));
        expect(await screen.findByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
    });
});
