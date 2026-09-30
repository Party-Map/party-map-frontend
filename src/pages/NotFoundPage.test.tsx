import { screen } from "@testing-library/react";

import { NotFoundPage } from "@/pages/NotFoundPage";
import { renderWithProviders } from "@/test/helpers";

describe("NotFoundPage", () => {
    it("shows the 404 message with a link back to the map", async () => {
        renderWithProviders(<NotFoundPage />, { route: "/nope", path: "/nope" });
        expect(await screen.findByRole("heading", { name: "404" })).toHaveClass("code");
        expect(screen.getByText("Lost in the party")).toBeInTheDocument();
        expect(screen.getByText(/didn’t make the guest list/)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to Map" })).toHaveAttribute("href", "/");
    });
});
