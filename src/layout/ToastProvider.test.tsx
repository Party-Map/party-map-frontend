import { act, render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { ToastProvider, useToast } from "./ToastProvider";

interface Globals {
    jest?: unknown;
}

function Probe() {
    const toast = useToast();
    const [answer, setAnswer] = useState("");
    const ask = (options: Parameters<typeof toast.confirm>[0]) =>
        void toast.confirm(options).then((a) => setAnswer(String(a)));
    return (
        <div>
            <button type="button" onClick={() => toast.success("Saved")}>
                success
            </button>
            <button type="button" onClick={() => toast.error("Failed")}>
                error
            </button>
            <button type="button" onClick={() => toast.info("FYI")}>
                info
            </button>
            <button
                type="button"
                onClick={() => ask({ title: "Delete place?", text: "This cannot be undone.", confirmLabel: "Delete" })}
            >
                confirm custom
            </button>
            <button type="button" onClick={() => ask({ title: "Sure?", text: "Really." })}>
                confirm default
            </button>
            <p data-testid="answer">{answer}</p>
        </div>
    );
}

function renderProbe() {
    return render(
        <ToastProvider>
            <Probe />
        </ToastProvider>,
    );
}

describe("messages", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
        // testing-library only drives a fake clock it recognises as Jest's; expose the same surface for vitest.
        const globals = globalThis as Globals;
        globals.jest = { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) };
    });

    afterEach(() => {
        delete (globalThis as Globals).jest;
        vi.useRealTimers();
    });

    it("shows each kind as a status and dismisses it after 2.5 seconds", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderProbe();
        await user.click(screen.getByRole("button", { name: "success" }));
        await user.click(screen.getByRole("button", { name: "error" }));
        await user.click(screen.getByRole("button", { name: "info" }));

        const toasts = screen.getAllByRole("status");
        expect(toasts.map((t) => t.textContent)).toEqual(["Saved", "Failed", "FYI"]);
        expect(toasts[0]).toHaveClass("toast", "success");
        expect(toasts[1]).toHaveClass("toast", "error");
        expect(toasts[2]).toHaveClass("toast", "info");

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2499);
        });
        expect(screen.getAllByRole("status")).toHaveLength(3);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });
        expect(screen.queryByRole("status")).toBeNull();
    });
});

describe("confirm", () => {
    it("renders an alert dialog and resolves true on confirm", async () => {
        renderProbe();
        await userEvent.click(screen.getByRole("button", { name: "confirm custom" }));
        const dialog = screen.getByRole("alertdialog", { name: "Delete place?" });
        expect(dialog).toHaveTextContent("This cannot be undone.");
        await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(await screen.findByText("true")).toBeInTheDocument();
    });

    it("uses a default label and resolves false on cancel", async () => {
        renderProbe();
        await userEvent.click(screen.getByRole("button", { name: "confirm default" }));
        const dialog = screen.getByRole("alertdialog", { name: "Sure?" });
        expect(within(dialog).getByRole("button", { name: "Confirm" })).toBeInTheDocument();
        await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
        expect(screen.queryByRole("alertdialog")).toBeNull();
        expect(await screen.findByText("false")).toBeInTheDocument();
    });
});

describe("useToast", () => {
    it("throws outside the provider", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useToast())).toThrow("useToast must be used inside ToastProvider");
    });
});
