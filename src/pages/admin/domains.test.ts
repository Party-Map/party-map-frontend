import { Role } from "@/auth/roles";

import {
    activeEntitySection,
    activeSection,
    ADMIN_DOMAINS,
    domainForPath,
    domainsForRoles,
    entityIdForPath,
    entitySectionPath,
} from "./domains";

const domain = (id: string) => ADMIN_DOMAINS.find((d) => d.id === id)!;

describe("admin domains", () => {
    it("are unlocked by their role, in display order", () => {
        expect(domainsForRoles([Role.USER])).toEqual([]);
        expect(domainsForRoles([Role.EVENT_ORGANIZER, Role.PLACE_MANAGER]).map((d) => d.id)).toEqual([
            "places",
            "events",
        ]);
        expect(domainsForRoles([Role.PARTYMAP_ADMIN]).map((d) => d.id)).toEqual(["platform"]);
    });

    it("belong to a path by their base path", () => {
        expect(domainForPath("/admin/places")?.id).toBe("places");
        expect(domainForPath("/admin/performers/list")?.id).toBe("performers");
        expect(domainForPath("/admin/events/plans/p1/edit")?.id).toBe("events");
        expect(domainForPath("/admin/platform/users")?.id).toBe("platform");
        expect(domainForPath("/admin")).toBeUndefined();
        expect(domainForPath("/admin/placesx")).toBeUndefined();
    });

    it("mark the section a path shows, detail and form pages included", () => {
        const places = domain("places");
        expect(activeSection(places, "/admin/places")?.id).toBe("overview");
        expect(activeSection(places, "/admin/places/list")?.id).toBe("list");
        expect(activeSection(places, "/admin/places/new")?.id).toBe("list");
        expect(activeSection(places, "/admin/places/6375cdd9")).toBeUndefined();
        expect(activeSection(places, "/admin/places/requests")?.id).toBe("requests");
        expect(activeSection(places, "/admin/places/a/b")).toBeUndefined();

        const events = domain("events");
        expect(activeSection(events, "/admin/events/plans/p1/edit")?.id).toBe("plans");
        expect(activeSection(events, "/admin/events/live")?.id).toBe("live");
        expect(activeSection(domain("platform"), "/admin/platform/users/u1")?.id).toBe("users");
    });

    it("give every section a unique id and a link inside its domain", () => {
        for (const d of ADMIN_DOMAINS) {
            expect(new Set(d.sections.map((s) => s.id)).size).toBe(d.sections.length);
            for (const s of d.sections) expect(domainForPath(s.to)).toBe(d);
        }
    });

    it("give each place and performer its own area, but not the domain's own pages", () => {
        const places = domain("places");
        expect(entityIdForPath(places, "/admin/places/p1")).toBe("p1");
        expect(entityIdForPath(places, "/admin/places/p1/requests")).toBe("p1");
        expect(entityIdForPath(places, "/admin/places/p1/edit")).toBe("p1");
        for (const own of ["/admin/places", "/admin/places/list", "/admin/places/new", "/admin/places/requests"]) {
            expect(entityIdForPath(places, own)).toBeUndefined();
        }
        expect(entityIdForPath(domain("events"), "/admin/events/plans")).toBeUndefined();
        expect(entityIdForPath(domain("performers"), "/admin/performers/x/edit")).toBe("x");
    });

    it("link and mark the sections of an item's area", () => {
        const performers = domain("performers");
        const sections = performers.entity!.sections;
        expect(sections.map((s) => entitySectionPath(performers, "x", s))).toEqual([
            "/admin/performers/x",
            "/admin/performers/x/requests",
            "/admin/performers/x/edit",
        ]);
        expect(activeEntitySection(performers, "x", "/admin/performers/x/requests")?.id).toBe("requests");
        expect(activeEntitySection(performers, "x", "/admin/performers/x")?.id).toBe("overview");
        expect(performers.entity!.publicPath("x")).toBe("/performers/x");
        expect(domain("places").entity!.publicPath("y")).toBe("/places/y");
    });
});
