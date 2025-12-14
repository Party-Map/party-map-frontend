import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchPerformer, getLineupInvitationsForPerformer} from "@/lib/api/performers"
import AdminPerformerEditForm from "./AdminPerformerEditForm"
import AdminPerformerLineupInvitationRequests from "@/app/admin/performers/[id]/AdminPerformerLineupInvitationRequests";

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
            <AdminPerformerEditForm initialPerformer={performer}/>
            <AdminPerformerLineupInvitationRequests invitationRequests={invitationRequests} performerId={performer.id}/>
        </div>
    )
}
