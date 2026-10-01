import { ADMIN_ROLES, isAdmin, isLabelledRole, MANAGER_ROLES, parseRoles, Role, ROLE_LABELS } from "./roles";

describe("parseRoles", () => {
    it("keeps only known roles", () => {
        expect(parseRoles(["user", "offline_access", 42, null, "place_manager_user", "uma_authorization"])).toEqual([
            "user",
            "place_manager_user",
        ]);
    });

    it("returns nothing for non-arrays", () => {
        expect(parseRoles(undefined)).toEqual([]);
        expect(parseRoles("user")).toEqual([]);
        expect(parseRoles({ roles: ["user"] })).toEqual([]);
    });

    it("knows every declared role", () => {
        expect(parseRoles(Object.values(Role))).toEqual(Object.values(Role));
    });
});

describe("isAdmin", () => {
    it("is false without a manager role", () => {
        expect(isAdmin([])).toBe(false);
        expect(isAdmin([Role.USER])).toBe(false);
    });

    it.each(ADMIN_ROLES)("is true with %s", (role) => {
        expect(isAdmin([Role.USER, role])).toBe(true);
    });

    it("is true for the platform admin alone", () => {
        expect(isAdmin([Role.USER, Role.PARTYMAP_ADMIN])).toBe(true);
    });

    it("lists the three manager roles and the platform admin", () => {
        expect(ADMIN_ROLES).toEqual([
            Role.PLACE_MANAGER,
            Role.PERFORMER_MANAGER,
            Role.EVENT_ORGANIZER,
            Role.PARTYMAP_ADMIN,
        ]);
    });
});

describe("manager roles", () => {
    it("are the grantable roles, never the platform admin", () => {
        expect(MANAGER_ROLES).toEqual([Role.PLACE_MANAGER, Role.PERFORMER_MANAGER, Role.EVENT_ORGANIZER]);
        expect(MANAGER_ROLES).not.toContain(Role.PARTYMAP_ADMIN);
    });

    it("have a label each, as has the platform admin", () => {
        expect(ROLE_LABELS[Role.PLACE_MANAGER]).toBe("Place manager");
        expect(ROLE_LABELS[Role.PARTYMAP_ADMIN]).toBe("Platform admin");
    });

    it("tell labelled roles from others", () => {
        expect(isLabelledRole("event_organizer_user")).toBe(true);
        expect(isLabelledRole("partymap_admin")).toBe(true);
        expect(isLabelledRole("user")).toBe(false);
        expect(isLabelledRole("toString")).toBe(false);
    });
});
