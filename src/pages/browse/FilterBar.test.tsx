import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { FilterBar } from "./FilterBar";

const SORTS = [
    { value: "distance", label: "Nearest first" },
    { value: "start", label: "Soonest first" },
];

describe("FilterBar", () => {
    it("reports the typed search once the typing pauses, and the sort at once", async () => {
        const onSearchChange = vi.fn();
        const onSort = vi.fn();
        renderWithProviders(
            <FilterBar
                search="jazz"
                onSearchChange={onSearchChange}
                placeholder="Search events"
                sort={{ value: "distance", options: SORTS, onChange: onSort }}
            >
                <p>chips</p>
            </FilterBar>,
        );
        const box = screen.getByRole("searchbox", { name: "Search events" });
        expect(box).toHaveValue("jazz");
        expect(screen.getByText("chips")).toBeInTheDocument();
        expect(onSearchChange).not.toHaveBeenCalled();

        await userEvent.clear(box);
        await userEvent.type(box, "techno");
        await waitFor(() => expect(onSearchChange).toHaveBeenCalledWith("techno"));
        expect(onSearchChange).toHaveBeenCalledTimes(1);

        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "start");
        expect(onSort).toHaveBeenCalledWith("start");
    });

    it("has no sort select when the list has one order", () => {
        renderWithProviders(<FilterBar search="" onSearchChange={() => {}} placeholder="Search performers" />);
        expect(screen.queryByRole("combobox")).toBeNull();
    });
});
