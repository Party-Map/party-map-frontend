import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchEventPlan} from "@/lib/api/eventPlan";
import EventPlanEditForm from "@/app/admin/events/[id]/EventPlanEditForm";
import InviteControls from "@/app/admin/events/[id]/InviteControls";
import LineupCreator from "@/app/admin/events/[id]/LineupCreator";
import {fetchPerformers} from "@/lib/api/performers";
import PublishButton from "@/app/admin/events/[id]/publishButton";

export default async function AdminEventPlanPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: string }>
}) {
    const session = await requireAdminRole(Role.PERFORMER_MANAGER_USER)
    const {id} = await params

    const eventPlan = await fetchEventPlan(id, session)
    const performers = await fetchPerformers(session)

    if (!eventPlan) {
        return notFound()
    }

    return (
        <div className="flex flex-row mx-auto max-w-[90%] pb-5 gap-5">
            <div className="flex flex-col w-full">
                <PublishButton eventPlan={eventPlan}/>
                <EventPlanEditForm initialEventPlan={eventPlan}/>
            </div>
            <div className="flex flex-col gap-6 items-start">
                <div>
                    <h1 className="mb-6 text-2xl font-bold">Place invitation</h1>
                    {(eventPlan.placeInvitation && eventPlan.placeInvitation.state != 'REJECTED') ? (
                        <p className="text-sm text-muted-foreground mb-2">
                            This event plan has been invited to a place ({eventPlan.placeInvitation.place.name}) with a
                            status of {eventPlan.placeInvitation.state}.
                        </p>
                    ) : (
                        <InviteControls initialEventPlan={eventPlan}/>
                    )}
                </div>

                <div>
                    <LineupCreator eventPlan={eventPlan} performers={performers}/>
                </div>
            </div>
        </div>
    )
}
