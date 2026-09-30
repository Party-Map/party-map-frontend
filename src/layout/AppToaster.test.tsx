import { act, render, screen } from "@testing-library/react";

import { setThemeChoice } from "@/lib/theme";
import { toast } from "@/lib/toast";

import { AppToaster } from "./AppToaster";

afterEach(() => setThemeChoice("system"));

describe("AppToaster", () => {
    it("shows notices in the app's theme", async () => {
        setThemeChoice("dark");
        render(<AppToaster />);
        act(() => toast.success("Place saved."));
        expect(await screen.findByText("Place saved.")).toBeInTheDocument();
        expect(screen.getByRole("region")).toBeInTheDocument();
        expect(document.querySelector("[data-sonner-toaster]")).toHaveAttribute("data-sonner-theme", "dark");
    });
});
