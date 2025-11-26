import {requireAdminRole} from "@/lib/auth/admin-roles";
import {Roles} from "@/lib/auth/roles";
import Link from "next/link";
import {PlaceAdminListItem} from "@/components/PlaceAdminListItem";
import {PlaceAdminListItemData} from "@/lib/types";
import {fetchMyPlaces} from "@/lib/api/places";


export default async function AdminPlacesPage() {
    const {session} = await requireAdminRole(Roles.PLACE_MANAGER_USER)

    const ownedPlaces: PlaceAdminListItemData[] | null = await fetchMyPlaces(session)
    return (
        <>
            <div className="flex flex-row justify-between ">
                <h1 className="text-2xl font-bold mb-2">Places admin</h1>
                <button>
                    <Link href="/admin/places/new">
                        Add a new Place
                    </Link>
                </button>
            </div>
            <ul className="space-y-3">
                {ownedPlaces && ownedPlaces.map((p) => (
                    <PlaceAdminListItem
                        key={p.id}
                        href={`/admin/places/${p.id}`}
                        name={p.name}
                        address={p.address}
                        city={p.city}
                    />
                ))}
            </ul>
        </>
    )
}