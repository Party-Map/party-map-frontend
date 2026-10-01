export const Role = {
    USER: "user",
    PLACE_MANAGER: "place_manager_user",
    PERFORMER_MANAGER: "performer_manager_user",
    EVENT_ORGANIZER: "event_organizer_user",
    /** Platform admin: grants and revokes the manager roles. Granted in Keycloak only. */
    PARTYMAP_ADMIN: "partymap_admin",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** The roles a platform admin can grant and revoke, in display order. */
export const MANAGER_ROLES = [Role.PLACE_MANAGER, Role.PERFORMER_MANAGER, Role.EVENT_ORGANIZER] as const;

export type ManagerRole = (typeof MANAGER_ROLES)[number];

/** Any of these opens the admin area; each one unlocks its own admin domain. */
export const ADMIN_ROLES: readonly Role[] = [...MANAGER_ROLES, Role.PARTYMAP_ADMIN];

/** How the admin pages name the roles. */
export const ROLE_LABELS: Record<ManagerRole | typeof Role.PARTYMAP_ADMIN, string> = {
    [Role.PLACE_MANAGER]: "Place manager",
    [Role.PERFORMER_MANAGER]: "Performer manager",
    [Role.EVENT_ORGANIZER]: "Event organizer",
    [Role.PARTYMAP_ADMIN]: "Platform admin",
};

const KNOWN_ROLES = new Set<string>(Object.values(Role));

/** Keep only the roles the app knows about; Keycloak also sends realm defaults like offline_access. */
export function parseRoles(raw: unknown): Role[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((r): r is Role => typeof r === "string" && KNOWN_ROLES.has(r));
}

export function isAdmin(roles: readonly Role[]): boolean {
    return roles.some((r) => ADMIN_ROLES.includes(r));
}

/** Narrows a role name from the API (a user's role list) to one the admin pages label. */
export function isLabelledRole(role: string): role is keyof typeof ROLE_LABELS {
    return Object.hasOwn(ROLE_LABELS, role);
}
