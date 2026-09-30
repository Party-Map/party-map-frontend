import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AlertDialog } from "./primitives";

describe("AlertDialog", () => {
    it("renders nothing while closed", () => {
        render(
            <AlertDialog open={false} title="Title" description="Text">
                <button type="button">OK</button>
            </AlertDialog>,
        );
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("shows the title, the description and the actions under the app's classes", async () => {
        render(
            <AlertDialog open title="Publish event?" description="This cannot be undone.">
                <button type="button">Publish</button>
            </AlertDialog>,
        );
        const dialog = await screen.findByRole("alertdialog", { name: "Publish event?" });
        expect(dialog).toHaveClass("popup");
        expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
        expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    });

    it("asks to close on Escape when it may be dismissed", async () => {
        const onOpenChange = vi.fn();
        render(
            <AlertDialog open title="Title" description="Text" onOpenChange={onOpenChange}>
                <button type="button">OK</button>
            </AlertDialog>,
        );
        await screen.findByRole("alertdialog");
        await userEvent.keyboard("{Escape}");
        expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    });
});
