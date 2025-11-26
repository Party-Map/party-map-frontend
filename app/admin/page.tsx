import {redirect} from "next/navigation"
import {getJwtSession} from "@/lib/auth/server-session"
import {getAdminRoles} from "@/lib/auth/admin-roles";
import {AdminRole, Roles} from "@/lib/auth/roles";

export default async function AdminIndexPage() {
    const session = await getJwtSession()
    const adminRoles = getAdminRoles(session)

    if (adminRoles.length === 0) {
        redirect("/")
    }
    const roleToHref: Record<AdminRole, string> = {
        [Roles.PLACE_MANAGER_USER]: "/admin/places",
        [Roles.PERFORMER_MANAGER_USER]: "/admin/performers",
        [Roles.EVENT_ORGANIZER_USER]: "/admin/events",
    }

    const firstRole = adminRoles[0]

    redirect(roleToHref[firstRole])

}
