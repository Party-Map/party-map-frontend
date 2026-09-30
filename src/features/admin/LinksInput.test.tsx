import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import type { Link } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";

import { buildUrl, LinksInput, toSuffix } from "./LinksInput";

function Harness({ initial = [] }: { initial?: Link[] }) {
    const [links, setLinks] = useState(initial);
    return (
        <>
            <LinksInput value={links} onChange={setLinks} />
            <pre data-testid="links">{JSON.stringify(links)}</pre>
        </>
    );
}

const currentLinks = (): Link[] => JSON.parse(screen.getByTestId("links").textContent) as Link[];

describe("toSuffix and buildUrl", () => {
    it("strips and re-adds the network prefix", () => {
        expect(toSuffix("INSTAGRAM", "https://instagram.com/djtest")).toBe("djtest");
        expect(toSuffix("WEBSITE", "https://a38.hu")).toBe("a38.hu");
        expect(buildUrl("FACEBOOK", "party")).toBe("https://facebook.com/party");
    });

    it("leaves urls without the expected prefix untouched and drops blank suffixes", () => {
        expect(toSuffix("INSTAGRAM", "djtest")).toBe("djtest");
        expect(buildUrl("WEBSITE", "   ")).toBe("");
        expect(buildUrl("REDDIT", " r/techno ")).toBe("https://reddit.com/r/techno");
    });
});

describe("LinksInput", () => {
    it("starts with a hint and adds the first unused network", async () => {
        renderWithProviders(<Harness />);
        expect(screen.getByText("Add Instagram, Facebook, Twitter, Reddit or a website.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "+ Add link" }));

        expect(screen.queryByText("Add Instagram, Facebook, Twitter, Reddit or a website.")).not.toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Link type" })).toHaveValue("INSTAGRAM");
        expect(screen.getByText("https://instagram.com/")).toBeInTheDocument();
        expect(currentLinks()).toEqual([{ type: "INSTAGRAM", url: "" }]);
    });

    it("builds the full url from the typed suffix", async () => {
        renderWithProviders(<Harness initial={[{ type: "INSTAGRAM", url: "" }]} />);
        await userEvent.type(screen.getByRole("textbox", { name: "Instagram link" }), "djtest");
        expect(currentLinks()).toEqual([{ type: "INSTAGRAM", url: "https://instagram.com/djtest" }]);

        await userEvent.clear(screen.getByRole("textbox", { name: "Instagram link" }));
        expect(currentLinks()).toEqual([{ type: "INSTAGRAM", url: "" }]);
    });

    it("keeps the suffix when the network changes", async () => {
        renderWithProviders(<Harness initial={[{ type: "INSTAGRAM", url: "https://instagram.com/djtest" }]} />);
        await userEvent.selectOptions(screen.getByRole("combobox", { name: "Link type" }), "FACEBOOK");

        expect(currentLinks()).toEqual([{ type: "FACEBOOK", url: "https://facebook.com/djtest" }]);
        expect(screen.getByRole("textbox", { name: "Facebook link" })).toHaveValue("djtest");
        expect(screen.getByText("https://facebook.com/")).toBeInTheDocument();
    });

    it("ignores a change to a network that is already used and edits links independently", async () => {
        renderWithProviders(
            <Harness
                initial={[
                    { type: "INSTAGRAM", url: "https://instagram.com/a" },
                    { type: "FACEBOOK", url: "https://facebook.com/b" },
                ]}
            />,
        );
        const [first] = screen.getAllByRole("combobox", { name: "Link type" });
        expect(first).toBeDefined();
        if (!first) return;

        expect(screen.getByRole("option", { name: "Facebook", selected: false })).toBeDisabled();
        fireEvent.change(first, { target: { value: "FACEBOOK" } });
        expect(currentLinks()).toEqual([
            { type: "INSTAGRAM", url: "https://instagram.com/a" },
            { type: "FACEBOOK", url: "https://facebook.com/b" },
        ]);

        await userEvent.type(screen.getByRole("textbox", { name: "Facebook link" }), "c");
        expect(currentLinks()).toEqual([
            { type: "INSTAGRAM", url: "https://instagram.com/a" },
            { type: "FACEBOOK", url: "https://facebook.com/bc" },
        ]);
    });

    it("removes a link", async () => {
        renderWithProviders(
            <Harness
                initial={[
                    { type: "INSTAGRAM", url: "https://instagram.com/a" },
                    { type: "WEBSITE", url: "https://a38.hu" },
                ]}
            />,
        );
        await userEvent.click(screen.getByRole("button", { name: "Remove Instagram link" }));
        expect(currentLinks()).toEqual([{ type: "WEBSITE", url: "https://a38.hu" }]);
    });

    it("disables adding once every network has a link", () => {
        renderWithProviders(
            <Harness
                initial={[
                    { type: "INSTAGRAM", url: "" },
                    { type: "FACEBOOK", url: "" },
                    { type: "TWITTER", url: "" },
                    { type: "REDDIT", url: "" },
                    { type: "WEBSITE", url: "" },
                ]}
            />,
        );
        expect(screen.getByRole("button", { name: "+ Add link" })).toBeDisabled();
        expect(screen.getAllByRole("combobox", { name: "Link type" })).toHaveLength(5);
    });

    it("uses the given label", () => {
        renderWithProviders(<LinksInput value={[]} onChange={() => {}} label="Social profiles" />);
        expect(screen.getByText("Social profiles")).toBeInTheDocument();
    });
});
