import { screen, within } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
    it("shows breadcrumbs, the title, the description, the actions and the content", () => {
        renderWithProviders(
            <AdminPage
                title="My places"
                description="Your venues."
                breadcrumbs={[{ label: "Places", to: "/admin/places" }, { label: "My places" }]}
                actions={<button type="button">New place</button>}
            >
                <p>table</p>
            </AdminPage>,
        );

        const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
        expect(within(crumbs).getByRole("link", { name: "Places" })).toHaveAttribute("href", "/admin/places");
        expect(within(crumbs).getByText("My places")).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("heading", { level: 1, name: "My places" })).toBeInTheDocument();
        expect(screen.getByText("Your venues.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "New place" })).toBeInTheDocument();
        expect(screen.getByText("table")).toBeInTheDocument();
    });

    it("leaves out what it is not given", () => {
        renderWithProviders(<AdminPage title="Overview" breadcrumbs={[]} />);

        expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
        expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
});
