import {requireAdminRole} from "@/lib/auth/admin-roles";
import {Roles} from "@/lib/auth/roles";

export default async function AdminPlacesPage() {
    await requireAdminRole(Roles.PLACE_MANAGER_USER)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Places admin</h1>
        </div>
    )
}