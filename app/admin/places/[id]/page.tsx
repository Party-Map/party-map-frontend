import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchPlace} from "@/lib/api/places"
import PlaceEditForm from "./PlaceEditForm"


export default async function AdminPlacePage({params}: { params: Promise<{ id: string }> }) {
    const session = await requireAdminRole(Role.PLACE_MANAGER_USER)
    const {id} = await params
    const place = await fetchPlace(id, session)

    if (!place) {
        return notFound()
    }

    return (
        <PlaceEditForm initialPlace={place}/>
    )
}
