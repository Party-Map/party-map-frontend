import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/helpers";

import { Pager } from "./Pager";

describe("Pager", () => {
    it("is hidden when everything fits on the first page", () => {
        renderWithProviders(<Pager page={0} size={20} total={20} onPageChange={vi.fn()} />);
        expect(screen.queryByRole("navigation", { name: "Pages" })).not.toBeInTheDocument();
    });

    it("shows the range and moves between pages", async () => {
        const onPageChange = vi.fn();
        renderWithProviders(<Pager page={1} size={20} total={57} onPageChange={onPageChange} />);

        expect(screen.getByText("21–40 of 57")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Previous" }));
        await userEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onPageChange.mock.calls).toEqual([[0], [2]]);
    });

    it("disables the way past either end", () => {
        const { rerender } = renderWithProviders(<Pager page={0} size={20} total={30} onPageChange={vi.fn()} />);
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

        rerender(<Pager page={1} size={20} total={30} onPageChange={vi.fn()} />);
        expect(screen.getByText("21–30 of 30")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("stays visible on a page past the end so the admin can go back", () => {
        renderWithProviders(<Pager page={3} size={20} total={5} onPageChange={vi.fn()} />);
        expect(screen.getByText("5–5 of 5")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    });
});
