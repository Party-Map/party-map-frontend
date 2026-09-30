import { ADMIN_ROLES, isAdmin, parseRoles, Role } from "./roles";

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

    it("lists the three manager roles", () => {
        expect(ADMIN_ROLES).toEqual([Role.PLACE_MANAGER, Role.PERFORMER_MANAGER, Role.EVENT_ORGANIZER]);
    });
});
