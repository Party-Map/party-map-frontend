import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchEventPlan} from "@/lib/api/event-plan";
import AdminEventPlanEditForm from "@/app/admin/events/[id]/AdminEventPlanEditForm";
import AdminInviteControls from "@/app/admin/events/[id]/AdminInviteControls";
import AdminLineupCreator from "@/app/admin/events/[id]/AdminLineupCreator";
import {fetchPerformers} from "@/lib/api/performers";
import AdminPublishButton from "@/app/admin/events/[id]/AdminPublishButton";
import {ID} from "@/lib/types";

export default async function AdminEventPlanPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: ID }>
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
                <AdminPublishButton eventPlan={eventPlan}/>
                <AdminEventPlanEditForm initialEventPlan={eventPlan}/>
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
                        <AdminInviteControls initialEventPlan={eventPlan}/>
                    )}
                </div>

                <div>
                    <AdminLineupCreator eventPlan={eventPlan} performers={performers}/>
                </div>
            </div>
        </div>
    )
}
