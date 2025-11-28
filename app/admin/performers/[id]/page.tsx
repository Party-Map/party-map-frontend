import {notFound} from "next/navigation"
import {requireAdminRole} from "@/app/admin/admin-roles"
import {Role} from "@/lib/auth/role"
import {fetchPerformer} from "@/lib/api/performers"
import PerformerEditForm from "./PerformerEditForm"

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

    return <PerformerEditForm initialPerformer={performer}/>
}
