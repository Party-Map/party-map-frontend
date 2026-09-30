import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { browser, markSignedIn, registerSignIn, sessionEnded } from "./session";
import { SessionEndedDialog } from "./SessionEndedDialog";

describe("SessionEndedDialog", () => {
    it("stays closed while the session is fine", () => {
        render(<SessionEndedDialog />);
        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("opens when the session ends and offers to sign in or refresh", async () => {
        const start = vi.fn();
        registerSignIn(start);
        const reload = vi.spyOn(browser, "reload").mockImplementation(() => undefined);
        markSignedIn();
        render(<SessionEndedDialog />);

        act(() => sessionEnded());
        const dialog = await screen.findByRole("alertdialog", { name: "Your session has ended" });
        expect(dialog).toHaveTextContent("Sign in again to continue");

        await userEvent.click(screen.getByRole("button", { name: "Refresh the page" }));
        expect(reload).toHaveBeenCalled();
        await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
        expect(start).toHaveBeenCalledTimes(1);
    });

    it("cannot be dismissed with Escape", async () => {
        markSignedIn();
        render(<SessionEndedDialog />);
        act(() => sessionEnded());
        await screen.findByRole("alertdialog");

        await userEvent.keyboard("{Escape}");
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
});
