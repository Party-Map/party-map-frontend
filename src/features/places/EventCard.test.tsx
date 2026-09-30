import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatDateTimeRange } from "@/lib/dates";
import { event, place } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";
import { EventCard } from "./EventCard";

describe("EventCard", () => {
    it("shows cover, title, time range, venue link, details link and price", () => {
        renderWithProviders(<EventCard event={event} place={place} />);

        expect(screen.getByRole("img", { name: event.title })).toHaveAttribute("src", event.image);
        expect(screen.getByRole("heading", { name: event.title })).toBeInTheDocument();
        expect(screen.getByText(formatDateTimeRange(event.start, event.end))).toBeInTheDocument();
        expect(screen.getByRole("link", { name: place.name })).toHaveAttribute("href", "/places/place-1");
        expect(screen.getByRole("link", { name: "Details →" })).toHaveAttribute("href", "/events/event-1");
        expect(screen.getByText("3000")).toBeInTheDocument();
    });

    it("omits the venue line and the price when they are not available", () => {
        renderWithProviders(<EventCard event={{ ...event, price: undefined }} />);

        expect(screen.queryByText(/^at /)).not.toBeInTheDocument();
        expect(screen.queryByText("3000")).not.toBeInTheDocument();
    });
});
