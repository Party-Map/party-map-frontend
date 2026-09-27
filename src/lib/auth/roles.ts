export const Role = {
  USER: 'user',
  PLACE_MANAGER: 'place_manager_user',
  PERFORMER_MANAGER: 'performer_manager_user',
  EVENT_ORGANIZER: 'event_organizer_user',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const ADMIN_ROLES: readonly Role[] = [Role.PLACE_MANAGER, Role.PERFORMER_MANAGER, Role.EVENT_ORGANIZER]

const KNOWN_ROLES = new Set<string>(Object.values(Role))

/** Keep only the roles the app knows about; Keycloak also sends realm defaults like offline_access. */
export function parseRoles(raw: unknown): Role[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((r): r is Role => typeof r === 'string' && KNOWN_ROLES.has(r))
}

export function isAdmin(roles: readonly Role[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r))
}
