import { screen, within } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { type Column, DataTable } from "./DataTable";

interface Row {
    id: string;
    name: string;
    city: string;
    count: number;
}

const rows: Row[] = [
    { id: "a", name: "Danube Club", city: "Budapest", count: 3 },
    { id: "b", name: "Pier Lounge", city: "Füred", count: 0 },
];

const columns: Column<Row>[] = [
    { id: "name", header: "Name", cell: (row) => row.name, primary: true },
    { id: "city", header: "City", cell: (row) => row.city, hideOnPhone: true },
    { id: "count", header: "Events", cell: (row) => row.count, align: "end" },
];

describe("DataTable", () => {
    it("renders a captioned table with a row header per row", () => {
        renderWithProviders(
            <DataTable caption="Your places" columns={columns} rows={rows} rowKey={(row) => row.id} empty="None" />,
        );

        const table = screen.getByRole("table", { name: "Your places" });
        expect(
            within(table)
                .getAllByRole("columnheader")
                .map((th) => th.textContent),
        ).toEqual(["Name", "City", "Events"]);
        expect(
            within(table)
                .getAllByRole("rowheader")
                .map((th) => th.textContent),
        ).toEqual(["Danube Club", "Pier Lounge"]);
        expect(within(table).queryByRole("link")).not.toBeInTheDocument();
        expect(screen.getByText("Budapest")).toHaveAttribute("data-label", "City");
        expect(screen.getByText("Budapest")).toHaveClass("hide-on-phone");
        expect(screen.getByText("3")).toHaveClass("end");
    });

    it("makes each row a link named by its primary cell", () => {
        renderWithProviders(
            <DataTable
                caption="Your places"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                rowTo={(row) => `/admin/places/${row.id}`}
                empty="None"
            />,
        );

        expect(screen.getByRole("link", { name: "Danube Club" })).toHaveAttribute("href", "/admin/places/a");
        expect(screen.getByRole("link", { name: "Pier Lounge" })).toHaveAttribute("href", "/admin/places/b");
        expect(screen.getAllByRole("row")[1]).toHaveClass("linked");
    });

    it("shows the empty message instead of an empty table", () => {
        renderWithProviders(
            <DataTable caption="Your places" columns={columns} rows={[]} rowKey={(row) => row.id} empty="No places." />,
        );

        expect(screen.queryByRole("table")).not.toBeInTheDocument();
        expect(screen.getByText("No places.")).toBeInTheDocument();
    });
});
