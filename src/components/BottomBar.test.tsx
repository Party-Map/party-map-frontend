import { screen, within } from "@testing-library/react";

import { BottomBar } from "@/components/BottomBar";
import { authenticatedSnapshot, renderWithProviders } from "@/test/helpers";

describe("BottomBar", () => {
    it("holds the mobile account actions and a compact theme toggle", async () => {
        renderWithProviders(<BottomBar />);
        const nav = await screen.findByRole("navigation", { name: "Mobile navigation" });
        expect(nav).toHaveClass("bottomWrapper");
        expect(within(nav).getByRole("button", { name: "Sign in" })).toHaveClass("item", "mobile");
        const toggle = within(nav).getByRole("button", { name: "Toggle theme" });
        expect(toggle).toHaveClass("toggle", "compact");
        expect(toggle).toHaveTextContent("");
    });

    it("shows the signed-in links", async () => {
        renderWithProviders(<BottomBar />, { auth: authenticatedSnapshot() });
        expect(await screen.findByRole("link", { name: "Profile" })).toHaveClass("item", "mobile");
        expect(screen.getByRole("link", { name: "Likes" })).toHaveAttribute("href", "/profile/likes");
    });
});
