import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";

import { renderWithProviders } from "@/test/helpers";

import { hasInAppHistory, PageShell } from "./PageShell";

/** The detail page between the map and the list it can fall back to. */
function pages() {
    return (
        <Routes>
            <Route path="/" element={<p>map here</p>} />
            <Route path="/browse/places" element={<p>list here</p>} />
            <Route
                path="/places/:id"
                element={
                    <PageShell backTo="/browse/places">
                        <p>detail here</p>
                    </PageShell>
                }
            />
        </Routes>
    );
}

describe("PageShell", () => {
    it("frames the content with the bars and a back link to the map", async () => {
        renderWithProviders(<PageShell>hello</PageShell>);
        const back = await screen.findByRole("link", { name: "Back" });
        expect(back).toHaveAttribute("href", "/");
        expect(back).toHaveClass("back");
        expect(screen.getByRole("banner")).toBeInTheDocument();
        expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
        const main = screen.getByRole("main");
        expect(main).toHaveTextContent("hello");
        expect(main).toHaveClass("main");
        expect(main).not.toHaveClass("wide");
        expect(main.querySelector(".footer")).toBeNull();
    });

    it("customises the back link", async () => {
        renderWithProviders(
            <PageShell backTo="/events/1" backLabel="Event">
                x
            </PageShell>,
        );
        expect(await screen.findByRole("link", { name: "Event" })).toHaveAttribute("href", "/events/1");
    });

    it("hides the back link when backTo is null", async () => {
        renderWithProviders(<PageShell backTo={null}>x</PageShell>);
        expect(await screen.findByRole("main")).toHaveTextContent("x");
        expect(screen.queryByRole("link", { name: "Back" })).toBeNull();
    });

    it("renders a footer section and the wide layout", async () => {
        renderWithProviders(
            <PageShell wide footer={<p>footer text</p>}>
                x
            </PageShell>,
        );
        const main = await screen.findByRole("main");
        expect(main).toHaveClass("main", "wide");
        expect(main.querySelector(".footer")).toHaveTextContent("footer text");
    });
});

describe("PageShell back navigation", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns to the page the user came from when there is in-app history", async () => {
        vi.spyOn(window.history, "state", "get").mockReturnValue({ idx: 1, key: "k", usr: null });
        renderWithProviders(pages(), { history: ["/"], route: "/places/place-1", path: "*" });
        expect(await screen.findByText("detail here")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("link", { name: "Back" }));
        expect(await screen.findByText("map here")).toBeInTheDocument();
    });

    it("falls back to the list when the user landed on the page directly", async () => {
        vi.spyOn(window.history, "state", "get").mockReturnValue({ idx: 0, key: "k", usr: null });
        renderWithProviders(pages(), { route: "/places/place-1", path: "*" });
        expect(await screen.findByText("detail here")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("link", { name: "Back" }));
        expect(await screen.findByText("list here")).toBeInTheDocument();
    });

    it("reads the router's entry index from the history state", () => {
        const state = vi.spyOn(window.history, "state", "get");
        state.mockReturnValue(null);
        expect(hasInAppHistory()).toBe(false);
        state.mockReturnValue({ idx: 0 });
        expect(hasInAppHistory()).toBe(false);
        state.mockReturnValue({ idx: "2" });
        expect(hasInAppHistory()).toBe(false);
        state.mockReturnValue({ idx: 3 });
        expect(hasInAppHistory()).toBe(true);
    });
});
