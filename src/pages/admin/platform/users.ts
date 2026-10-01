import type { AdminUser } from "@/api/types";
import { isLabelledRole, Role, ROLE_LABELS } from "@/auth/roles";

/** First and last name, or the username when Keycloak has no name. */
export function displayName(user: AdminUser): string {
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
}

/** The user's roles the admin pages know, labelled, the platform admin last. */
export function roleLabels(user: AdminUser): string[] {
    return user.roles
        .filter(isLabelledRole)
        .toSorted((a, b) => Number(a === Role.PARTYMAP_ADMIN) - Number(b === Role.PARTYMAP_ADMIN))
        .map((role) => ROLE_LABELS[role]);
}
