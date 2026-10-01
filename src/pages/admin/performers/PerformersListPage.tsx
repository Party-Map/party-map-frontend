import { Plus } from "lucide-react";

import { useOwnedPerformers, usePerformers } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { type Column, DataTable } from "@/pages/admin/shared/DataTable";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

interface PerformerRow {
    id: string;
    name: string;
    genre: string;
}

const COLUMNS: Column<PerformerRow>[] = [
    { id: "name", header: "Name", cell: (performer) => performer.name, primary: true },
    { id: "genre", header: "Genre", cell: (performer) => performer.genre || "—" },
];

/** /admin/performers/list: the performers the manager owns. */
export function PerformersListPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <AdminPage
                title="My performers"
                breadcrumbs={[{ label: "Performers", to: "/admin/performers" }, { label: "My performers" }]}
                actions={
                    <ButtonLink to="/admin/performers/new">
                        <Plus size={16} aria-hidden />
                        New performer
                    </ButtonLink>
                }
            >
                <PerformersTable />
            </AdminPage>
        </RequireRole>
    );
}

function PerformersTable() {
    const owned = useOwnedPerformers();
    // The owned list carries names only; the public list adds the genre.
    const all = usePerformers();

    if (owned.isPending || all.isPending) return <LoadingState />;
    if (!owned.data || !all.data) {
        const retry = () => {
            void owned.refetch();
            void all.refetch();
        };
        return <ErrorState message="Could not load your performers." onRetry={retry} />;
    }
    const genres = new Map(all.data.map((performer) => [performer.id, performer.genre]));
    const rows = owned.data.map((performer) => ({ ...performer, genre: genres.get(performer.id) ?? "" }));

    return (
        <DataTable
            caption="Your performers"
            columns={COLUMNS}
            rows={rows}
            rowKey={(performer) => performer.id}
            rowTo={(performer) => `/admin/performers/${performer.id}`}
            empty="You do not represent any performers yet. Add your first one."
        />
    );
}
