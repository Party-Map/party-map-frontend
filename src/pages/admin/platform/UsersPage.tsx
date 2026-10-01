import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { messageOf } from "@/api/client";
import { useAdminUsers } from "@/api/hooks";
import type { AdminUser } from "@/api/types";
import { Role } from "@/auth/roles";
import { Field, Input } from "@/components/Field";
import { ErrorState, LoadingState } from "@/components/States";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { RequireRole } from "@/pages/admin/RequireRole";
import { type Column, DataTable } from "@/pages/admin/shared/DataTable";
import { Pager } from "@/pages/admin/shared/Pager";
import { StatusChip } from "@/pages/admin/shared/StatusChip";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

import { displayName, roleLabels } from "./users";
import styles from "./UsersPage.module.scss";

export const PAGE_SIZE = 20;

const COLUMNS: Column<AdminUser>[] = [
    {
        id: "user",
        header: "User",
        primary: true,
        cell: (user) => (
            <span className={styles.user}>
                {displayName(user)}
                <span className={styles.username}>{user.username}</span>
            </span>
        ),
    },
    {
        id: "status",
        header: "Status",
        cell: (user) =>
            user.enabled ? <StatusChip tone="success">Active</StatusChip> : <StatusChip>Disabled</StatusChip>,
    },
    {
        id: "roles",
        header: "Roles",
        cell: (user) => {
            const labels = roleLabels(user);
            return labels.length === 0 ? (
                "—"
            ) : (
                <span className={styles.roles}>
                    {labels.map((label) => (
                        <StatusChip key={label} tone="info">
                            {label}
                        </StatusChip>
                    ))}
                </span>
            );
        },
    },
];

/** /admin/platform/users: every Keycloak user, searchable, each opening their role settings. */
export function UsersPage() {
    return (
        <RequireRole role={Role.PARTYMAP_ADMIN}>
            <AdminPage
                title="Users"
                description="Grant or revoke the manager roles. A change applies when the user next signs in or their session refreshes."
                breadcrumbs={[{ label: "Platform", to: "/admin/platform" }, { label: "Users" }]}
            >
                <Users />
            </AdminPage>
        </RequireRole>
    );
}

function Users() {
    const [params, setParams] = useSearchParams();
    const q = params.get("q") ?? "";
    const page = Math.max(0, Math.floor(Number(params.get("page")) || 0));
    const [text, setText] = useState(q);
    const typed = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
    const users = useAdminUsers({ q, page, size: PAGE_SIZE });

    // The URL follows the search box once typing pauses; a new search starts at the first page.
    useEffect(() => {
        if (typed === q) return;
        setParams(typed ? { q: typed } : {}, { replace: true });
    }, [typed, q, setParams]);

    const goTo = (next: number) => {
        const nextParams = new URLSearchParams(params);
        if (next > 0) nextParams.set("page", String(next));
        else nextParams.delete("page");
        setParams(nextParams);
    };

    return (
        <div className={styles.stack}>
            <Field label="Search users" hint="Part of a name, username or email.">
                {(id) => (
                    <span className={styles.search}>
                        <Search size={16} aria-hidden className={styles.searchIcon} />
                        <Input
                            id={id}
                            type="search"
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            className={styles.searchInput}
                            autoComplete="off"
                        />
                    </span>
                )}
            </Field>
            {users.isPending ? (
                <LoadingState label="Loading users…" />
            ) : users.error ? (
                <ErrorState
                    message={messageOf(users.error, "Could not load the users.")}
                    onRetry={() => void users.refetch()}
                />
            ) : (
                <>
                    <DataTable
                        caption="Users"
                        columns={COLUMNS}
                        rows={users.data.items}
                        rowKey={(user) => user.id}
                        rowTo={(user) => `/admin/platform/users/${user.id}${params.size > 0 ? `?${params}` : ""}`}
                        empty={q ? `No user matches “${q}”.` : "There are no users yet."}
                    />
                    <Pager page={page} size={PAGE_SIZE} total={users.data.total} onPageChange={goTo} />
                </>
            )}
        </div>
    );
}
