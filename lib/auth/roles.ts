export enum Roles {
    PERFORMER_MANAGER_USER = "performer_manager_user",
    PLACE_MANAGER_USER = "place_manager_user",
    EVENT_ORGANIZER_USER = "event_organizer_user",
    USER = "user",
}

export const ADMIN_ROLES = [
    Roles.PLACE_MANAGER_USER,
    Roles.PERFORMER_MANAGER_USER,
    Roles.EVENT_ORGANIZER_USER,
] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]
