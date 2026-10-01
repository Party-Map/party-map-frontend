import { toast } from "sonner";

import { shareOrCopy } from "./share";

const link = { title: "Techno Night", url: "https://terkep.party/events/event-1" };

function stubNavigator(overrides: { share?: unknown; clipboard?: unknown }) {
    for (const [key, value] of Object.entries(overrides)) {
        Object.defineProperty(navigator, key, { configurable: true, value });
    }
}

describe("shareOrCopy", () => {
    afterEach(() => {
        Reflect.deleteProperty(navigator, "share");
        Reflect.deleteProperty(navigator, "clipboard");
    });

    it("uses the share sheet when the browser has one", async () => {
        const share = vi.fn(async () => {});
        const writeText = vi.fn(async () => {});
        stubNavigator({ share, clipboard: { writeText } });
        await shareOrCopy(link);
        expect(share).toHaveBeenCalledWith(link);
        expect(writeText).not.toHaveBeenCalled();
    });

    it("stays quiet when the user closes the sheet, copies when the sheet fails otherwise", async () => {
        const success = vi.spyOn(toast, "success");
        const writeText = vi.fn(async () => {});
        const abort = Object.assign(new Error("closed"), { name: "AbortError" });
        stubNavigator({ share: vi.fn(async () => Promise.reject(abort)), clipboard: { writeText } });
        await shareOrCopy(link);
        expect(writeText).not.toHaveBeenCalled();

        stubNavigator({ share: vi.fn(async () => Promise.reject(new Error("no targets"))) });
        await shareOrCopy(link);
        expect(writeText).toHaveBeenCalledWith(link.url);
        expect(success).toHaveBeenCalledWith("Link copied");
    });

    it("copies the link without a share sheet and reports a clipboard failure", async () => {
        const success = vi.spyOn(toast, "success");
        const error = vi.spyOn(toast, "error");
        const writeText = vi.fn(async () => {});
        stubNavigator({ clipboard: { writeText } });
        await shareOrCopy(link);
        expect(writeText).toHaveBeenCalledWith(link.url);
        expect(success).toHaveBeenCalledWith("Link copied");

        stubNavigator({ clipboard: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) } });
        await shareOrCopy(link);
        expect(error).toHaveBeenCalledWith("Could not copy the link.");
    });
});
