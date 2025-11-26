import {requireAdminRole} from "@/lib/auth/admin-roles";
import {Roles} from "@/lib/auth/roles";

export default async function AdminPerformersPage() {
    await requireAdminRole(Roles.PERFORMER_MANAGER_USER)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Performers admin</h1>
        </div>
    )
}