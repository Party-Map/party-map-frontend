import { screen } from "@testing-library/react";
import { MapPin } from "lucide-react";

import { renderWithProviders } from "@/test/helpers";

import { StatCard } from "./StatCard";

describe("StatCard", () => {
    it("links to the list it counts", () => {
        renderWithProviders(<StatCard label="Places" value={3} icon={MapPin} to="/admin/places/list" hint="Yours" />);

        const link = screen.getByRole("link", { name: /Places\s*3\s*Yours/ });
        expect(link).toHaveAttribute("href", "/admin/places/list");
    });

    it("can be a plain card and mark a number that needs attention", () => {
        renderWithProviders(<StatCard label="Waiting" value={2} icon={MapPin} attention />);

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        expect(screen.getByText("2")).toHaveAttribute("data-attention", "true");
    });

    it("does not mark a calm number", () => {
        renderWithProviders(<StatCard label="Waiting" value={0} icon={MapPin} />);

        expect(screen.getByText("0")).not.toHaveAttribute("data-attention");
    });
});
