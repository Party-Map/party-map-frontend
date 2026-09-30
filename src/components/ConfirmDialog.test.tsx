import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "./ConfirmDialog";

function renderDialog(open = true) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
        <ConfirmDialog
            open={open}
            title="Publish event?"
            text="This cannot be undone."
            confirmLabel="Yes, publish"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />,
    );
    return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
    it("asks and reports the answer", async () => {
        const { onConfirm, onCancel } = renderDialog();
        expect(await screen.findByRole("alertdialog", { name: "Publish event?" })).toHaveAccessibleDescription(
            "This cannot be undone.",
        );
        await userEvent.click(screen.getByRole("button", { name: "Yes, publish" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("cancels on Escape", async () => {
        const { onCancel } = renderDialog();
        await screen.findByRole("alertdialog");
        await userEvent.keyboard("{Escape}");
        expect(onCancel).toHaveBeenCalled();
    });

    it("labels the confirm button Confirm by default and renders nothing while closed", () => {
        render(<ConfirmDialog open={false} title="T" text="X" onConfirm={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });
});
