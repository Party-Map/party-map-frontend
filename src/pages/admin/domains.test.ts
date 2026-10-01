import { Role } from "@/auth/roles";

import { activeSection, ADMIN_DOMAINS, domainForPath, domainsForRoles } from "./domains";

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
        expect(activeSection(places, "/admin/places/6375cdd9")?.id).toBe("list");
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
});
