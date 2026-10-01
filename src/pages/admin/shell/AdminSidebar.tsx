import { Drawer } from "@base-ui/react/drawer";
import { ArrowLeft, X } from "lucide-react";
import { Link, useLocation } from "react-router";

import { cn } from "@/lib/utils";
import { activeSection, type AdminDomain } from "@/pages/admin/domains";

import styles from "./AdminSidebar.module.scss";

interface SidebarNavProps {
    domain: AdminDomain | undefined;
    /** Called after a link is followed, so the phone drawer can close. */
    onNavigate?: () => void;
}

/** The current domain's sections; the section the page belongs to is marked as the current page. */
function SidebarNav({ domain, onNavigate }: SidebarNavProps) {
    const { pathname } = useLocation();
    const active = domain ? activeSection(domain, pathname) : undefined;

    return (
        <nav className={styles.nav} aria-label="Admin sections">
            {domain && (
                <div className={styles.domain}>
                    <span className={styles.domainLabel}>{domain.label}</span>
                    <span className={styles.domainDescription}>{domain.description}</span>
                </div>
            )}
            <ul className={styles.list}>
                {domain?.sections.map((section) => {
                    const Icon = section.icon;
                    const current = section.id === active?.id;
                    return (
                        <li key={section.id}>
                            <Link
                                to={section.to}
                                className={cn(styles.link, current && styles.current)}
                                aria-current={current ? "page" : undefined}
                                onClick={onNavigate}
                            >
                                <Icon size={18} aria-hidden />
                                {section.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <div className={styles.footer}>
                <Link to="/" className={styles.link} onClick={onNavigate}>
                    <ArrowLeft size={18} aria-hidden />
                    Back to the map
                </Link>
            </div>
        </nav>
    );
}

interface AdminSidebarProps {
    domain: AdminDomain | undefined;
    /** Phone drawer state; on desktop the sidebar is always shown. */
    drawerOpen: boolean;
    onDrawerOpenChange: (open: boolean) => void;
}

/** The left navigation: a fixed column on desktop, a drawer that slides in from the left on phones. */
export function AdminSidebar({ domain, drawerOpen, onDrawerOpenChange }: AdminSidebarProps) {
    return (
        <>
            <aside className={styles.sidebar}>
                <SidebarNav domain={domain} />
            </aside>
            <Drawer.Root open={drawerOpen} onOpenChange={onDrawerOpenChange} swipeDirection="left">
                <Drawer.Portal>
                    <Drawer.Backdrop className={styles.backdrop} />
                    <Drawer.Viewport className={styles.viewport}>
                        <Drawer.Popup className={styles.drawer}>
                            <Drawer.Content className={styles.drawerContent}>
                                <div className={styles.drawerHeader}>
                                    <Drawer.Title className={styles.drawerTitle}>Navigation</Drawer.Title>
                                    <Drawer.Close className={styles.close} aria-label="Close navigation">
                                        <X size={20} aria-hidden />
                                    </Drawer.Close>
                                </div>
                                <SidebarNav domain={domain} onNavigate={() => onDrawerOpenChange(false)} />
                            </Drawer.Content>
                        </Drawer.Popup>
                    </Drawer.Viewport>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    );
}
