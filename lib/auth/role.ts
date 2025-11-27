export enum Role {
    PERFORMER_MANAGER_USER = "performer_manager_user",
    PLACE_MANAGER_USER = "place_manager_user",
    EVENT_ORGANIZER_USER = "event_organizer_user",
    USER = "user",
}

export const ADMIN_ROLES = [
    Role.PLACE_MANAGER_USER,
    Role.PERFORMER_MANAGER_USER,
    Role.EVENT_ORGANIZER_USER,
];
