import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LineupItem } from "@/lib/types";
import { performer } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { LineupList } from "./LineupList";

const early: LineupItem = { startTime: "2030-06-01T22:00:00", endTime: "2030-06-02T00:00:00", performer };
const late: LineupItem = {
    startTime: "2030-06-02T00:00:00",
    endTime: "2030-06-02T02:00:00",
    performer: { ...performer, id: "performer-2", name: "Late DJ", genre: "house" },
};

describe("LineupList", () => {
    it("lists the sets sorted by start time with HH:mm ranges and genres", () => {
        renderWithProviders(<LineupList items={[late, early]} />);

        expect(screen.getByRole("heading", { name: "Lineup & Set Times" })).toBeInTheDocument();
        const items = screen.getAllByRole("listitem");
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent("DJ Test");
        expect(items[0]).toHaveTextContent("22:00 – 00:00");
        expect(items[0]).toHaveTextContent("techno");
        expect(items[1]).toHaveTextContent("Late DJ");
        expect(items[1]).toHaveTextContent("00:00 – 02:00");
        expect(screen.getByRole("link", { name: "DJ Test" })).toHaveAttribute("href", "/performers/performer-1");
    });

    it("shows an empty message when there are no sets", () => {
        renderWithProviders(<LineupList items={[]} />);

        expect(screen.getByText("No lineup announced yet.")).toBeInTheDocument();
        expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
});
