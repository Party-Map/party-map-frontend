import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchEventPlan} from "@/lib/api/eventPlan";
import EventPlanEditForm from "@/app/admin/events/[id]/EventPlanEditForm";

export default async function AdminEventPlanPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: string }>
}) {
    const session = await requireAdminRole(Role.PERFORMER_MANAGER_USER)
    const {id} = await params

    const eventPlan = await fetchEventPlan(id, session)

    if (!eventPlan) {
        return notFound()
    }

    return <EventPlanEditForm initialEventPlan={eventPlan}/>
}
