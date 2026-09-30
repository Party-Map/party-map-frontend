import { screen } from "@testing-library/react";

import { PageShell } from "@/components/PageShell";
import { renderWithProviders } from "@/test/helpers";

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
