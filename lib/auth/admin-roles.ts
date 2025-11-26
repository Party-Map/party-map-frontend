import {notFound, redirect} from "next/navigation"
import {getJwtSession} from "@/lib/auth/server-session"
import {JwtSession} from "@/lib/auth/jwt-session"
import {ADMIN_ROLES, AdminRole} from "@/lib/auth/roles";

/**
 * Return only admin roles for this session.
 * If the user has no admin roles (or no session), returns [].
 */
export function getAdminRoles(session: JwtSession | null): AdminRole[] {
    if (!session) return []

    const rawRoles = session.getJwtClaims()?.realm_access?.roles ?? []

    return rawRoles.filter((role): role is AdminRole =>
        ADMIN_ROLES.includes(role as AdminRole)
    )
}

/**
 * Ensure the current user has at least one of the required admin roles.
 * Redirects to login if there is no session.
 * Throws 404 if the user doesn't have the required role.
 */
export async function requireAdminRole(required: AdminRole | AdminRole[]) {
    const session = await getJwtSession()
    const callback = "/admin"

    if (!session) {
        redirect(`/auth/login?callback=${encodeURIComponent(callback)}`)
    }

    const roles = getAdminRoles(session)
    const requiredRoles = Array.isArray(required) ? required : [required]

    const hasRole = roles.some((role) =>
        requiredRoles.includes(role as AdminRole)
    )

    if (!hasRole) {
        notFound()
    }

    return {session, roles}
}

/**
 * Check if a session has ANY admin role.
 */
export function hasAnyAdminRole(session: JwtSession | null): boolean {
    return getAdminRoles(session).length > 0
}