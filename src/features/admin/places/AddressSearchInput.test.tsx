import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import type { GeocodeResult } from "@/lib/types";
import { mockApi, renderWithProviders } from "@/test/helpers";

import { AddressSearchInput } from "./AddressSearchInput";

const searchAnswer = [
    {
        display_name: "Váci utca 5, Budapest, Hungary",
        lat: "47.4930",
        lon: "19.0520",
        address: { road: "Váci utca", house_number: "5", postcode: "1052", city: "Budapest" },
    },
    { display_name: "Váci út, Budapest, Hungary", lat: "47.5300", lon: "19.0600" },
];

function Harness({ onSelect }: { onSelect: (result: GeocodeResult) => void }) {
    const [value, setValue] = useState("");
    return (
        <>
            <label htmlFor="address">Address</label>
            <AddressSearchInput id="address" value={value} onChange={setValue} onSelect={onSelect} />
            <button type="button" onClick={() => setValue("Set from outside")}>
                set externally
            </button>
        </>
    );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("AddressSearchInput", () => {
    it("searches the typed text after a debounce and lists the matches", async () => {
        const fetchMock = mockApi({ "GET /search": searchAnswer });
        renderWithProviders(<Harness onSelect={() => {}} />);

        await userEvent.type(screen.getByRole("combobox", { name: "Address" }), "Váci");
        expect(fetchMock).not.toHaveBeenCalled();

        const options = await screen.findAllByRole("option");
        expect(options.map((option) => option.textContent)).toEqual([
            "Váci utca 5, 1052, Budapest",
            "Váci út, Budapest, Hungary",
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
        expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/search");
        expect(url.searchParams.get("q")).toBe("Váci");
        expect(screen.getByRole("combobox", { name: "Address" })).toHaveAttribute("aria-expanded", "true");
    });

    it("reports the picked result, closes the list and does not search the value set by the pick", async () => {
        const fetchMock = mockApi({ "GET /search": searchAnswer });
        const onSelect = vi.fn();
        renderWithProviders(<Harness onSelect={onSelect} />);

        await userEvent.type(screen.getByRole("combobox", { name: "Address" }), "Váci");
        await userEvent.click(await screen.findByRole("option", { name: "Váci út, Budapest, Hungary" }));

        expect(onSelect).toHaveBeenCalledWith({
            displayName: "Váci út, Budapest, Hungary",
            addressLine: "",
            location: { latitude: 47.53, longitude: 19.06 },
        });
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "set externally" }));
        await sleep(500);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("closes on Escape or blur and reopens on focus while matches exist", async () => {
        mockApi({ "GET /search": searchAnswer });
        renderWithProviders(<Harness onSelect={() => {}} />);
        const input = screen.getByRole("combobox", { name: "Address" });

        await userEvent.type(input, "Váci");
        expect(await screen.findByRole("listbox")).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

        await userEvent.keyboard("{ArrowDown}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

        await userEvent.tab();
        await userEvent.click(input);
        expect(screen.getByRole("listbox")).toBeInTheDocument();

        await userEvent.tab();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("shows a loading hint while the search is running and nothing when it finds no match", async () => {
        const pending = vi.fn(() => new Promise<Response>(() => {}));
        vi.stubGlobal("fetch", pending);
        const { unmount } = renderWithProviders(<Harness onSelect={() => {}} />);

        await userEvent.type(screen.getByRole("combobox", { name: "Address" }), "Váci");
        expect(await screen.findByText("…")).toBeInTheDocument();
        unmount();

        const fetchMock = mockApi({ "GET /search": [] });
        renderWithProviders(<Harness onSelect={() => {}} />);
        await userEvent.type(screen.getByRole("combobox", { name: "Address" }), "Nowhere");
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("…")).not.toBeInTheDocument();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not search whitespace", async () => {
        const fetchMock = mockApi({ "GET /search": searchAnswer });
        renderWithProviders(<Harness onSelect={() => {}} />);

        await userEvent.type(screen.getByRole("combobox", { name: "Address" }), "   ");
        await sleep(500);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
