import {notFound} from "next/navigation"
import {requireAdminRole} from "@/lib/auth/admin-roles"
import {Roles} from "@/lib/auth/roles"
import {fetchPlace} from "@/lib/api/places"
import PlaceEditForm from "./PlaceEditForm"

export default async function AdminPlacePage({params}: { params: Promise<{ id: string }> }) {
    const {session} = await requireAdminRole(Roles.PLACE_MANAGER_USER)
    const {id} = await params
    const place = await fetchPlace(id, session)

    if (!place) {
        return notFound()
    }

    return <PlaceEditForm initialPlace={place}/>
}
