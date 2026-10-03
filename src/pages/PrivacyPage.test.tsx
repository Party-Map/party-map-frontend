import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { PrivacyPage } from "./PrivacyPage";

describe("PrivacyPage", () => {
    it("says what is stored, where, and how to get it deleted", async () => {
        renderWithProviders(<PrivacyPage />);
        expect(await screen.findByRole("heading", { level: 1, name: "Privacy notice" })).toBeInTheDocument();
        for (const name of ["Your account", "What the app keeps", "In your browser", "Map data", "Your rights"]) {
            expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
        }
        expect(screen.getByRole("link", { name: "adrian@szell.dev" })).toHaveAttribute(
            "href",
            "mailto:adrian@szell.dev",
        );
        expect(document.title).toContain("Privacy notice");
    });
});
