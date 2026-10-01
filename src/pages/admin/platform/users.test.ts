import { adminUser, adminUser2 } from "@/test/fixtures";

import { displayName, roleLabels } from "./users";

describe("admin users", () => {
    it("are named by their name, or their username without one", () => {
        expect(displayName(adminUser)).toBe("Jane Doe");
        expect(displayName({ ...adminUser, lastName: null })).toBe("Jane");
        expect(displayName(adminUser2)).toBe("bob@example.com");
    });

    it("list their known roles with labels, the platform admin last", () => {
        expect(
            roleLabels({ ...adminUser, roles: ["partymap_admin", "offline_access", "event_organizer_user"] }),
        ).toEqual(["Event organizer", "Platform admin"]);
        expect(roleLabels(adminUser2)).toEqual([]);
    });
});
