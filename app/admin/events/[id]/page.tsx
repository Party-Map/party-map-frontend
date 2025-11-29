import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchEventPlan} from "@/lib/api/eventPlan";
import EventPlanEditForm from "@/app/admin/events/[id]/EventPlanEditForm";
import InviteControls from "@/app/admin/events/[id]/InviteControls";

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

    return (
        <main className="flex flex-col mx-auto max-w-[90%] pb-5 gap-5">
            {(eventPlan.placeInvitation && eventPlan.placeInvitation.state != 'REJECTED') ? (
                <div>
                    <h1 className="mb-6 text-2xl font-bold">Place invitation</h1>
                    <p className="text-sm text-muted-foreground mb-2">
                        This event plan has been invited to a place ({eventPlan.placeInvitation.place.name}) with a
                        status of {eventPlan.placeInvitation.state}.
                    </p>
                </div>
            ) : (
                <div>
                    <h1 className="mb-6 text-2xl font-bold">Place invitation</h1>
                    <InviteControls initialEventPlan={eventPlan}/>
                </div>
            )}
            <div>
                <EventPlanEditForm initialEventPlan={eventPlan}/>
            </div>
        </main>
    )
}
