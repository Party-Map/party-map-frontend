import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { RootLayout } from "@/app/RootLayout";
import { CONSENT_STORAGE_KEY } from "@/lib/constants";

function renderLayout() {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route element={<RootLayout />}>
                    <Route index element={<p>child page</p>} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );
}

describe("RootLayout", () => {
    it("renders the matched child route with the consent banner", () => {
        renderLayout();
        expect(screen.getByText("child page")).toBeInTheDocument();
        expect(screen.getByRole("dialog", { name: "Privacy & Cookies" })).toBeInTheDocument();
    });

    it("omits the banner once consent was given", () => {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ t: 1, v: 1 }));
        renderLayout();
        expect(screen.getByText("child page")).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
