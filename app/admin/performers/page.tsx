import {requireAdminRole} from "@/app/admin/admin-roles";
import {Role} from "@/lib/auth/role";

export default async function AdminPerformersPage() {
    await requireAdminRole(Role.PERFORMER_MANAGER_USER)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Performers admin</h1>
        </div>
    )
}