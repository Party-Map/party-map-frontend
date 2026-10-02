import { fireEvent, render, within } from "@testing-library/react";
import { Command } from "cmdk";

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
        <Command shouldFilter={false}>
            <Command.List>
                <SearchResultItem hit={hit} onPick={onPick} onView={onView} />
            </Command.List>
        </Command>,
    );
    return { onPick, onView, item: within(container).getByRole("option") };
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2030, 5, 15, 12, 0));
});

afterEach(() => {
    vi.useRealTimers();
});

describe("SearchResultItem", () => {
    it("shows the title, subtitle, a named type badge on the thumbnail and the next event date twice", () => {
        const { item } = renderItem(placeHit);
        expect(within(item).getByText("A38 Hajó")).toHaveClass("item-title");
        expect(within(item).getByText("Budapest")).toHaveClass("subtitle-text");
        expect(within(item).getByText("Budapest").parentElement).toHaveClass("item-subtitle");
        // The type is a coloured icon on the thumbnail's corner; its name is for screen readers only.
        const typeName = within(item).getByText("Place");
        expect(typeName).toHaveClass("sr-only");
        expect(typeName.parentElement).toHaveClass("type-badge", "type-place");
        expect(typeName.parentElement?.parentElement).toHaveClass("thumb");
        // Phones read the date inside the subtitle, wider screens in its own column (CSS shows one of them).
        expect(within(item).getByText("1 Jun")).toHaveClass("item-date");
        expect(within(item).getByText("· 1 Jun")).toHaveClass("inline-date");
        expect(item.querySelector("img")).toHaveAttribute("src", place.image);
    });

    it("labels events and performers by type", () => {
        expect(within(renderItem(eventHit).item).getByText("Event").parentElement).toHaveClass("type-event");
        expect(within(renderItem(performerHit).item).getByText("Performer").parentElement).toHaveClass(
            "type-performer",
        );
    });

    it("omits the date without an upcoming event and uses the placeholder image", () => {
        const { item } = renderItem(performerHit);
        expect(item.querySelector(".item-date")).toBeNull();
        expect(item.querySelector(".inline-date")).toBeNull();
        expect(item.querySelector("img")).toHaveAttribute("src", PLACEHOLDER_IMAGE);
        expect(within(item).getByText("techno")).toHaveClass("subtitle-text");
    });

    it("picks the hit when the option is chosen and opens its page from View alone", () => {
        const { item, onPick, onView } = renderItem(eventHit);
        expect(item).toHaveAccessibleName(/Techno Night/);
        fireEvent.click(item);
        expect(onPick).toHaveBeenCalledTimes(1);
        expect(onView).not.toHaveBeenCalled();

        fireEvent.click(within(item).getByRole("button", { name: "View" }));
        expect(onView).toHaveBeenCalledTimes(1);
        expect(onPick).toHaveBeenCalledTimes(1);
    });
});
