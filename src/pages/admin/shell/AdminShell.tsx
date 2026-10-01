import { useState } from "react";
import { Outlet, useLocation } from "react-router";

import { useAuth } from "@/auth/provider";
import { LoadingState } from "@/components/States";
import { PageShell } from "@/layout/PageShell";
import { SignInRequired } from "@/layout/SignInRequired";
import { domainForPath, domainsForRoles } from "@/pages/admin/domains";

import { AdminHeader } from "./AdminHeader";
import styles from "./AdminShell.module.scss";
import { AdminSidebar } from "./AdminSidebar";
import { NoAccessCard } from "./NoAccessCard";

/**
 * Frame of every /admin route: a top bar with the domain switcher and account menu, the domain's sections on the
 * left, the page on the right. Only checks that the user holds some admin role; each page checks its own role.
 */
export function AdminShell() {
    const { status, roles, isAdmin } = useAuth();
    const { pathname, search } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

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
    const current = domainForPath(pathname);

    return (
        <div className={styles.shell}>
            <AdminHeader domains={domains} current={current} onOpenNavigation={() => setDrawerOpen(true)} />
            <div className={styles.body}>
                <AdminSidebar domain={current} drawerOpen={drawerOpen} onDrawerOpenChange={setDrawerOpen} />
                <main id="admin-main" className={styles.main} tabIndex={-1}>
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
