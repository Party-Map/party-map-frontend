import {getJwtSession} from "@/lib/auth/server-session"
import {Role} from "@/lib/auth/role";
import {redirect} from "next/navigation";

export default async function AdminIndexPage() {
    const session = await getJwtSession()
    const roleToHref: Partial<Record<Role, string>> = {
        [Role.PLACE_MANAGER_USER]: "/admin/places",
        [Role.PERFORMER_MANAGER_USER]: "/admin/performers",
        [Role.EVENT_ORGANIZER_USER]: "/admin/events",
    }

    const target = session?.getRoles().map(role => roleToHref[role])
        .filter(v => !!v)[0]


    if (target !== undefined) {
        redirect(target)
    }
}
