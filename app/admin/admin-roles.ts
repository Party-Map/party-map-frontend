import {notFound, redirect} from "next/navigation"
import {getJwtSession} from "@/lib/auth/server-session"
import {Role} from "@/lib/auth/role";

/**
 * Ensure the current user has at least one of the required admin roles.
 * Redirects to login if there is no session.
 * Throws 404 if the user doesn't have the required role.
 */
export async function requireAdminRole(required: Role | Role[]) {
    const session = await getJwtSession()
    const callback = "/admin"

    if (!session) {
        redirect(`/auth/login?callback=${encodeURIComponent(callback)}`)
    }

    const requiredRoles = Array.isArray(required) ? required : [required]
    const hasRole = requiredRoles.every(role => session.hasRole(role));

    if (!hasRole) {
        notFound()
    }

    return session
}