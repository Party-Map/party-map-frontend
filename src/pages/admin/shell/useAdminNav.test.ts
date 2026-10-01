import { ADMIN_DOMAINS } from "@/pages/admin/domains";

import { adminNav } from "./useAdminNav";

const places = ADMIN_DOMAINS.find((d) => d.id === "places")!;
const events = ADMIN_DOMAINS.find((d) => d.id === "events")!;

describe("adminNav", () => {
    it("is empty outside the domains", () => {
        expect(
            adminNav({ domain: undefined, entityId: undefined, entity: undefined, pending: 0, pathname: "/admin/x" }),
        ).toEqual({ title: "", subtitle: "", items: [] });
    });

    it("lists a domain's sections with the current one marked", () => {
        const nav = adminNav({
            domain: events,
            entityId: undefined,
            entity: undefined,
            pending: 0,
            pathname: "/admin/events/live",
        });
        expect(nav.title).toBe("Events");
        expect(nav.back).toBeUndefined();
        expect(nav.items.map((item) => [item.label, item.current])).toEqual([
            ["Overview", false],
            ["Event plans", false],
            ["Live events", true],
        ]);
    });

    it("lists an item's own sections with its name, the way back, its public page and the waiting count", () => {
        const nav = adminNav({
            domain: places,
            entityId: "p1",
            entity: { id: "p1", name: "A38" },
            pending: 2,
            pathname: "/admin/places/p1/requests",
        });
        expect(nav).toMatchObject({
            title: "A38",
            subtitle: "Place",
            back: { label: "All places", to: "/admin/places" },
            publicHref: "/places/p1",
        });
        expect(nav.items.map((item) => [item.label, item.to, item.current, item.badge])).toEqual([
            ["Overview", "/admin/places/p1", false, undefined],
            ["Event requests", "/admin/places/p1/requests", true, 2],
            ["Details", "/admin/places/p1/edit", false, undefined],
        ]);
    });

    it("names an item it does not know yet by its kind and shows no badge without waiting requests", () => {
        const nav = adminNav({
            domain: places,
            entityId: "p9",
            entity: undefined,
            pending: 0,
            pathname: "/admin/places/p9",
        });
        expect(nav.title).toBe("Place");
        expect(nav.items.every((item) => item.badge === undefined)).toBe(true);
    });
});
