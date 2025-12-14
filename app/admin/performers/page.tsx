import {requireAdminRole} from "@/app/admin/admin-roles";
import {Role} from "@/lib/auth/role";
import {PerformerAdminListItemData} from "@/lib/types";
import {fetchMyPerformers} from "@/lib/api/performers";
import Link from "next/link";
import {AdminPerformerListItem} from "@/app/admin/performers/AdminPerformerListItem";

export default async function AdminPerformersPage() {
    const session = await requireAdminRole(Role.PERFORMER_MANAGER_USER)
    const ownedPerformers: PerformerAdminListItemData[] | null = await fetchMyPerformers(session)
    return (
        <>
            <div className="flex flex-row justify-between ">
                <h1 className="text-2xl font-bold mb-2">Performers admin</h1>
                <button>
                    <Link href="/admin/performers/new"
                          className="flex-1 px-3 py-2 text-sm font-medium text-center rounded-lg cursor-pointer bg-violet-600 text-white">
                        Add new Performer
                    </Link>
                </button>
            </div>
            <ul className="space-y-3">
                {ownedPerformers && ownedPerformers.map((p) => (
                    <AdminPerformerListItem
                        key={p.id}
                        href={`/admin/performers/${p.id}`}
                        name={p.name}
                    />
                ))}
            </ul>
        </>
    )
}