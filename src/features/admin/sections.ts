import { Role } from "@/lib/auth/roles";

export interface AdminSection {
    role: Role;
    path: string;
    label: string;
}

/** Admin areas in tab order; a user sees the ones matching their roles. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
    { role: Role.PLACE_MANAGER, path: "/admin/places", label: "Manage your Places" },
    { role: Role.PERFORMER_MANAGER, path: "/admin/performers", label: "Manage your Performers" },
    { role: Role.EVENT_ORGANIZER, path: "/admin/events", label: "Manage your Events" },
];

export function sectionsForRoles(roles: readonly Role[]): AdminSection[] {
    return ADMIN_SECTIONS.filter((section) => roles.includes(section.role));
}
