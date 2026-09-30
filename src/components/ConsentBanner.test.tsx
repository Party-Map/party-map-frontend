import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConsentBanner } from "@/components/ConsentBanner";
import { CONSENT_STORAGE_KEY } from "@/lib/constants";

function stored(): unknown {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
}

describe("ConsentBanner", () => {
    it("asks for consent until a choice is stored", () => {
        render(<ConsentBanner />);
        const dialog = screen.getByRole("dialog", { name: "Privacy & Cookies" });
        expect(dialog).toHaveTextContent("This site uses cookies and local storage");
        expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    });

    it("stays hidden once a choice was stored", () => {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ t: 1, v: 1, rejected: true }));
        const { container } = render(<ConsentBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it("stores acceptance as version 1 and hides", async () => {
        const before = Date.now();
        render(<ConsentBanner />);
        await userEvent.click(screen.getByRole("button", { name: "Accept" }));
        expect(screen.queryByRole("dialog")).toBeNull();
        const value = stored();
        expect(value).toEqual({ t: expect.any(Number), v: 1 });
        expect(value).not.toHaveProperty("rejected");
        expect((value as { t: number }).t).toBeGreaterThanOrEqual(before);
    });

    it("stores rejection with the rejected flag", async () => {
        render(<ConsentBanner />);
        await userEvent.click(screen.getByRole("button", { name: "Reject" }));
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(stored()).toEqual({ t: expect.any(Number), v: 1, rejected: true });
    });

    it("stays hidden when storage cannot be read", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("denied");
        });
        const { container } = render(<ConsentBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it("still hides after answering when storage cannot be written", async () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota");
        });
        render(<ConsentBanner />);
        await userEvent.click(screen.getByRole("button", { name: "Accept" }));
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
