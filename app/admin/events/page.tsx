import {Role} from "@/lib/auth/role";
import {requireAdminRole} from "@/app/admin/admin-roles";

export default async function AdminEventsPage() {
    await requireAdminRole(Role.EVENT_ORGANIZER_USER)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Events admin</h1>
        </div>
    )
}