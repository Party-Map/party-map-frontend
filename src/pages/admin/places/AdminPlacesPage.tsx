import { fetchOwnedPlaces } from "@/api/places";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { useResource } from "@/lib/hooks/useResource";
import { RequireRole } from "@/pages/admin/RequireRole";
import styles from "@/pages/admin/shared/admin.module.css";
import { AdminListItem } from "@/pages/admin/shared/AdminListItem";

/** /admin/places: the places the signed-in manager owns. */
export function AdminPlacesPage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <div className={styles.header}>
                <h1 className="page-title">Places admin</h1>
                <ButtonLink to="/admin/places/new">Add new Place</ButtonLink>
            </div>
            <OwnedPlacesList />
        </RequireRole>
    );
}

/** Loads only once the role guard has let the user through. */
function OwnedPlacesList() {
    const { data, loading, reload } = useResource(fetchOwnedPlaces, []);

    if (loading) return <LoadingState />;
    if (!data) return <ErrorState message="Could not load your places." onRetry={reload} />;
    if (data.length === 0) return <EmptyState message="You do not manage any places yet." />;

    return (
        <ul className={styles.list}>
            {data.map((place) => (
                <AdminListItem
                    key={place.id}
                    title={place.name}
                    lines={[`${place.address}, ${place.city}`]}
                    to={`/admin/places/${place.id}`}
                />
            ))}
        </ul>
    );
}
