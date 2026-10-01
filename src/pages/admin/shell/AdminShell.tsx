import { useState } from "react";
import { Outlet, useLocation } from "react-router";

import { useAuth } from "@/auth/provider";
import { LoadingState } from "@/components/States";
import { PageShell } from "@/layout/PageShell";
import { SignInRequired } from "@/layout/SignInRequired";
import { domainForPath, domainsForRoles, entityIdForPath } from "@/pages/admin/domains";

import { AdminHeader } from "./AdminHeader";
import styles from "./AdminShell.module.scss";
import { AdminSidebar } from "./AdminSidebar";
import { NoAccessCard } from "./NoAccessCard";
import { useAdminEntities } from "./useAdminEntities";
import { adminNav } from "./useAdminNav";

/**
 * Frame of every /admin route: a top bar with the domain switcher and account menu, the domain's sections on the
 * left, the page on the right. Only checks that the user holds some admin role; each page checks its own role.
 */
export function AdminShell() {
    const { status, roles, isAdmin, hasRole } = useAuth();
    const { pathname, search } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const current = domainForPath(pathname);
    const entityId = current ? entityIdForPath(current, pathname) : undefined;
    const entities = useAdminEntities(status === "authenticated" ? current : undefined, entityId);

    if (status === "loading") {
        return (
            <PageShell>
                <LoadingState label="Checking your access…" />
            </PageShell>
        );
    }
    if (status === "anonymous") {
        return (
            <SignInRequired
                returnTo={`${pathname}${search}`}
                message="You need to be signed in to use the admin area."
            />
        );
    }
    if (!isAdmin) return <NoAccessCard />;

    const domains = domainsForRoles(roles);
    const nav = adminNav({ domain: current, entityId, entity: entities.current, pending: entities.pending, pathname });

    return (
        <div className={styles.shell}>
            <AdminHeader
                domains={domains}
                current={current}
                {...(current && hasRole(current.role)
                    ? { entities: { items: entities.items, currentId: entityId, currentName: entities.current?.name } }
                    : {})}
                onOpenNavigation={() => setDrawerOpen(true)}
            />
            <div className={styles.body}>
                <AdminSidebar nav={nav} drawerOpen={drawerOpen} onDrawerOpenChange={setDrawerOpen} />
                <main id="admin-main" className={styles.main} tabIndex={-1}>
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
