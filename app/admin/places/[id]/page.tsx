import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchPlace} from "@/lib/api/places"
import AdminPlaceEditForm from "./AdminPlaceEditForm"
import AdminPlaceEventInvitationRequests from "@/app/admin/places/[id]/AdminPlaceEventInvitationRequests";
import {getInvitationForPlace} from "@/lib/api/event-plan";
import {ID} from "@/lib/types";


export default async function AdminPlacePage({params}: { params: Promise<{ id: ID }> }) {
    const session = await requireAdminRole(Role.PLACE_MANAGER_USER)
    const {id} = await params
    const place = await fetchPlace(id, session)
    const invitationRequests = await getInvitationForPlace(place.id, session)
    console.log(invitationRequests)

    if (!place) {
        return notFound()
    }

    return (
        <div className="flex flex-row mx-auto px-4 py-8 gap-4">
            <AdminPlaceEditForm initialPlace={place}/>
            <AdminPlaceEventInvitationRequests placeId={place.id} invitationRequests={invitationRequests}/>
        </div>
    )
}
