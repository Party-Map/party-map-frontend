import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchPerformer, getLineupInvitationsForPerformer} from "@/lib/api/performers"
import PerformerEditForm from "./PerformerEditForm"
import PerformerLineupInvitationRequests from "@/app/admin/performers/[id]/PerformerLineupInvitationRequests";

export default async function AdminPerformerPage({
                                                     params,
                                                 }: {
    params: Promise<{ id: string }>
}) {
    const session = await requireAdminRole(Role.PERFORMER_MANAGER_USER)
    const {id} = await params

    const performer = await fetchPerformer(id, session)
    if (!performer) {
        return notFound()
    }
    const invitationRequests = await getLineupInvitationsForPerformer(performer.id, session)
    console.log(invitationRequests)
    return (
        <div className="flex flex-row mx-auto px-4 py-8 gap-4">
            <PerformerEditForm initialPerformer={performer}/>
            <PerformerLineupInvitationRequests invitationRequests={invitationRequests} performerId={performer.id}/>
        </div>
    )
}
