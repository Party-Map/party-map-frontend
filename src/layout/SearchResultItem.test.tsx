import { fireEvent, render, within } from "@testing-library/react";

import type { SearchHit } from "@/api/types";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { event, performer, place } from "@/test/fixtures";

import { SearchResultItem } from "./SearchResultItem";

const placeHit: SearchHit = {
    id: place.id,
    type: "PLACE",
    title: place.name,
    subtitle: place.city,
    image: place.image,
    nextEventStart: event.start,
    placeId: null,
};

const eventHit: SearchHit = {
    ...placeHit,
    id: event.id,
    type: "EVENT",
    title: event.title,
    subtitle: place.name,
    placeId: place.id,
};

const performerHit: SearchHit = {
    id: performer.id,
    type: "PERFORMER",
    title: performer.name,
    subtitle: performer.genre,
    image: null,
    nextEventStart: null,
    placeId: null,
};

function renderItem(hit: SearchHit) {
    const onPick = vi.fn();
    const onView = vi.fn();
    const { container } = render(
        <ul>
            <SearchResultItem hit={hit} onPick={onPick} onView={onView} />
        </ul>,
    );
    return { onPick, onView, item: within(container).getByRole("listitem") };
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2030, 5, 15, 12, 0));
});

afterEach(() => {
    vi.useRealTimers();
});

describe("SearchResultItem", () => {
    it("shows the title, subtitle, type pill, thumbnail letter and next event date", () => {
        const { item } = renderItem(placeHit);
        expect(within(item).getByText("A38 Hajó")).toHaveClass("item-title");
        expect(within(item).getByText("Budapest")).toHaveClass("item-subtitle");
        expect(within(item).getByText("Place")).toHaveClass("type-pill", "type-place");
        expect(within(item).getByText("P")).toHaveClass("thumb-letter");
        expect(within(item).getByText("1 Jun")).toHaveClass("item-date");
        expect(item.querySelector("img")).toHaveAttribute("src", place.image);
    });

    it("labels events and performers by type", () => {
        expect(within(renderItem(eventHit).item).getByText("Event")).toHaveClass("type-event");
        expect(within(renderItem(performerHit).item).getByText("Performer")).toHaveClass("type-performer");
    });

    it("omits the date without an upcoming event and uses the placeholder image", () => {
        const { item } = renderItem(performerHit);
        expect(item.querySelector(".item-date")).toBeNull();
        expect(item.querySelector("img")).toHaveAttribute("src", PLACEHOLDER_IMAGE);
        expect(within(item).getByText("techno")).toHaveClass("item-subtitle");
    });

    it("picks from the main button and views from the view button independently", () => {
        const { item, onPick, onView } = renderItem(eventHit);
        fireEvent.click(within(item).getByRole("button", { name: /Techno Night/ }));
        expect(onPick).toHaveBeenCalledTimes(1);
        expect(onView).not.toHaveBeenCalled();

        fireEvent.click(within(item).getByRole("button", { name: "View" }));
        expect(onView).toHaveBeenCalledTimes(1);
        expect(onPick).toHaveBeenCalledTimes(1);
    });
});
