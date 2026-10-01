import { useParams, useSearchParams } from "react-router";

import { ApiError, messageOf } from "@/api/client";
import { useAdminUser } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { StatusChip } from "@/pages/admin/shared/StatusChip";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { RoleSwitches } from "./RoleSwitches";
import styles from "./UserDetailPage.module.scss";
import { displayName } from "./users";

/** /admin/platform/users/:id: one user's account and their manager roles. */
export function UserDetailPage() {
    return (
        <RequireRole role={Role.PARTYMAP_ADMIN}>
            <UserDetail />
        </RequireRole>
    );
}

function UserDetail() {
    const { id = "" } = useParams();
    // The list's search and page ride along, so going back lands where the admin was.
    const [params] = useSearchParams();
    const back = `/admin/platform/users${params.size > 0 ? `?${params}` : ""}`;
    const user = useAdminUser(id);

    if (user.error instanceof ApiError && user.error.status === 404) return <NotFoundPage />;
    if (user.isPending) return <LoadingState label="Loading user…" />;
    if (user.error) {
        return (
            <ErrorState
                message={messageOf(user.error, "Could not load the user.")}
                onRetry={() => void user.refetch()}
            />
        );
    }
    const name = displayName(user.data);

    return (
        <AdminPage
            title={name}
            description={user.data.email ?? user.data.username}
            breadcrumbs={[{ label: "Platform", to: "/admin/platform" }, { label: "Users", to: back }, { label: name }]}
        >
            <section className={styles.card} aria-labelledby="user-account">
                <h2 id="user-account" className={styles.title}>
                    Account
                </h2>
                <dl className={styles.facts}>
                    <dt>Username</dt>
                    <dd>{user.data.username}</dd>
                    <dt>Email</dt>
                    <dd>{user.data.email ?? "—"}</dd>
                    <dt>Status</dt>
                    <dd>
                        {user.data.enabled ? (
                            <StatusChip tone="success">Active</StatusChip>
                        ) : (
                            <StatusChip>Disabled</StatusChip>
                        )}
                    </dd>
                </dl>
            </section>
            <section className={styles.card} aria-labelledby="user-roles">
                <h2 id="user-roles" className={styles.title}>
                    Roles
                </h2>
                <p className={styles.hint}>
                    A change applies when the user next signs in or their session refreshes (within a few minutes).
                </p>
                <RoleSwitches user={user.data} />
            </section>
        </AdminPage>
    );
}
