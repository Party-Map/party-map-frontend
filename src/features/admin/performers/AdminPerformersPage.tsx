import { ButtonLink } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { AdminListItem } from "@/features/admin/AdminListItem";
import { RequireRole } from "@/features/admin/RequireRole";
import { fetchOwnedPerformers } from "@/lib/api/performers";
import { Role } from "@/lib/auth/roles";
import { useResource } from "@/lib/hooks/useResource";
import styles from "@/features/admin/admin.module.css";

/** /admin/performers: the performers the signed-in manager owns. */
export function AdminPerformersPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <div className={styles.header}>
                <h1 className="page-title">Performers admin</h1>
                <ButtonLink to="/admin/performers/new">Add new Performer</ButtonLink>
            </div>
            <OwnedPerformersList />
        </RequireRole>
    );
}

/** Loads only once the role guard has let the user through. */
function OwnedPerformersList() {
    const { data, loading, reload } = useResource(fetchOwnedPerformers, []);

    if (loading) return <LoadingState />;
    if (!data) return <ErrorState message="Could not load your performers." onRetry={reload} />;
    if (data.length === 0) return <EmptyState message="You do not manage any performers yet." />;

    return (
        <ul className={styles.list}>
            {data.map((performer) => (
                <AdminListItem key={performer.id} title={performer.name} to={`/admin/performers/${performer.id}`} />
            ))}
        </ul>
    );
}
