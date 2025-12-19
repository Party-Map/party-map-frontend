import {notFound, redirect} from "next/navigation"
import {getJwtSession} from "@/lib/auth/server-session"
import {Role} from "@/lib/auth/role";

/**
 * Ensure the current user has at least one of the required admin roles
 * @param required - A single Role or an array of Roles required to access the admin area
 * @returns The JWT session if the user has the required role(s)
 * @throws Redirect to login if there is no session.
 * @throws 404 Not Found if the user lacks the required role(s)
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