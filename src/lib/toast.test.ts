import { toast as sonner } from "sonner";

import { toast } from "./toast";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe("toast", () => {
    it("hands each kind of notice to sonner", () => {
        toast.success("Saved.");
        toast.error("Failed.");
        toast.info("Heads up.");
        expect(sonner.success).toHaveBeenCalledWith("Saved.");
        expect(sonner.error).toHaveBeenCalledWith("Failed.");
        expect(sonner.info).toHaveBeenCalledWith("Heads up.");
    });
});
