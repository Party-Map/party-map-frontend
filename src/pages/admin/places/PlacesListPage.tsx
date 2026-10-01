import { Plus } from "lucide-react";

import { useOwnedPlaces } from "@/api/hooks";
import type { PlaceListItem } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { type Column, DataTable } from "@/pages/admin/shared/DataTable";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

const COLUMNS: Column<PlaceListItem>[] = [
    { id: "name", header: "Name", cell: (place) => place.name, primary: true },
    { id: "address", header: "Address", cell: (place) => place.address || "—", hideOnPhone: true },
    { id: "city", header: "City", cell: (place) => place.city },
];

/** /admin/places/list: the places the manager owns. */
export function PlacesListPage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <AdminPage
                title="My places"
                breadcrumbs={[{ label: "Places", to: "/admin/places" }, { label: "My places" }]}
                actions={
                    <ButtonLink to="/admin/places/new">
                        <Plus size={16} aria-hidden />
                        New place
                    </ButtonLink>
                }
            >
                <PlacesTable />
            </AdminPage>
        </RequireRole>
    );
}

function PlacesTable() {
    const { data, isPending, refetch } = useOwnedPlaces();
    if (isPending) return <LoadingState />;
    if (!data) return <ErrorState message="Could not load your places." onRetry={() => void refetch()} />;
    return (
        <DataTable
            caption="Your places"
            columns={COLUMNS}
            rows={data}
            rowKey={(place) => place.id}
            rowTo={(place) => `/admin/places/${place.id}`}
            empty="You do not manage any places yet. Add your first one."
        />
    );
}
