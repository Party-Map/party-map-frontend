import { Role } from "@/lib/auth/roles";
import { ADMIN_SECTIONS, sectionsForRoles } from "./sections";

describe("ADMIN_SECTIONS", () => {
    it("lists one section per admin role in tab order", () => {
        expect(ADMIN_SECTIONS.map((section) => section.role)).toEqual([
            Role.PLACE_MANAGER,
            Role.PERFORMER_MANAGER,
            Role.EVENT_ORGANIZER,
        ]);
        expect(ADMIN_SECTIONS.map((section) => section.path)).toEqual([
            "/admin/places",
            "/admin/performers",
            "/admin/events",
        ]);
    });
});

describe("sectionsForRoles", () => {
    it("keeps only the sections the roles allow, in tab order", () => {
        const sections = sectionsForRoles([Role.EVENT_ORGANIZER, Role.USER, Role.PLACE_MANAGER]);
        expect(sections.map((section) => section.label)).toEqual(["Manage your Places", "Manage your Events"]);
    });

    it("returns nothing for plain users", () => {
        expect(sectionsForRoles([Role.USER])).toEqual([]);
        expect(sectionsForRoles([])).toEqual([]);
    });
});
