import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Event } from "@/api/types";
import { formatDateTimeRange } from "@/lib/dates";
import { event, performer, place } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

import { LikedTabs } from "./LikedTabs";

const pastEvent: Event = {
    ...event,
    id: "event-2",
    title: "Old Night",
    start: "2020-01-01T20:00:00",
    end: "2020-01-02T02:00:00",
};
const filled = { events: { upcoming: [event], past: [pastEvent] }, places: [place], performers: [performer] };
const empty = { events: { upcoming: [], past: [] }, places: [], performers: [] };

describe("LikedTabs", () => {
    it("opens on the events tab with upcoming and past sections", () => {
        renderWithProviders(<LikedTabs {...filled} />);

        expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: "Places" })).toHaveAttribute("aria-selected", "false");
        expect(screen.getByRole("heading", { name: "Upcoming events" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: event.title })).toHaveAttribute("href", "/events/event-1");
        expect(screen.getByText(formatDateTimeRange(event.start, event.end))).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Past events" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: pastEvent.title })).toHaveAttribute("href", "/events/event-2");
        expect(screen.getAllByText("Techno")).toHaveLength(2);
        expect(screen.queryByRole("link", { name: place.name })).not.toBeInTheDocument();
    });

    it("switches to the places and performers tabs", async () => {
        renderWithProviders(<LikedTabs {...filled} />);

        await userEvent.click(screen.getByRole("tab", { name: "Places" }));
        expect(screen.getByRole("tab", { name: "Places" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("heading", { name: "Places" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: place.name })).toHaveAttribute("href", "/places/place-1");
        expect(screen.getByText(place.city)).toBeInTheDocument();
        expect(screen.getByText(place.address)).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: event.title })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("tab", { name: "Performers" }));
        expect(screen.getByRole("heading", { name: "Performers" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: performer.name })).toHaveAttribute("href", "/performers/performer-1");
        expect(screen.getByText(performer.genre)).toBeInTheDocument();
        expect(screen.getByText(performer.bio)).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: place.name })).not.toBeInTheDocument();
    });

    it("shows an empty message on every tab", async () => {
        renderWithProviders(<LikedTabs {...empty} />);

        expect(screen.getByText("No upcoming events.")).toBeInTheDocument();
        expect(screen.getByText("No past events.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("tab", { name: "Places" }));
        expect(screen.getByText("You haven’t liked any places yet.")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("tab", { name: "Performers" }));
        expect(screen.getByText("You haven’t liked any performers yet.")).toBeInTheDocument();
    });
});
