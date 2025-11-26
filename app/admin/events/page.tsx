import {requireAdminRole} from "@/lib/auth/admin-roles";
import {Roles} from "@/lib/auth/roles";

export default async function AdminEventsPage() {
    await requireAdminRole(Roles.EVENT_ORGANIZER_USER)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Events admin</h1>
        </div>
    )
}