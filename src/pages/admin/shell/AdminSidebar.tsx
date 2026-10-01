import { Drawer } from "@base-ui/react/drawer";
import { ArrowLeft, ChevronLeft, ExternalLink, X } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import styles from "./AdminSidebar.module.scss";
import type { NavModel } from "./useAdminNav";

interface SidebarNavProps {
    nav: NavModel;
    /** Called after a link is followed, so the phone drawer can close. */
    onNavigate?: () => void;
}

/** The sections in view; the one the page belongs to is marked as the current page. */
function SidebarNav({ nav, onNavigate }: SidebarNavProps) {
    return (
        <nav className={styles.nav} aria-label="Admin sections">
            {nav.back && (
                <Link to={nav.back.to} className={styles.backLink} onClick={onNavigate}>
                    <ChevronLeft size={16} aria-hidden />
                    {nav.back.label}
                </Link>
            )}
            {nav.title && (
                <div className={styles.domain}>
                    <span className={styles.domainLabel}>{nav.title}</span>
                    <span className={styles.domainDescription}>{nav.subtitle}</span>
                </div>
            )}
            <ul className={styles.list}>
                {nav.items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <li key={item.id}>
                            <Link
                                to={item.to}
                                className={cn(styles.link, item.current && styles.current)}
                                aria-current={item.current ? "page" : undefined}
                                onClick={onNavigate}
                            >
                                <Icon size={18} aria-hidden />
                                <span className={styles.linkText}>{item.label}</span>
                                {item.badge !== undefined && (
                                    <span className={styles.badge} aria-label={`${item.badge} waiting`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <div className={styles.footer}>
                {nav.publicHref && (
                    <Link to={nav.publicHref} target="_blank" rel="noreferrer" className={styles.link}>
                        <ExternalLink size={18} aria-hidden />
                        <span className={styles.linkText}>View public page</span>
                        <span className="sr-only">(opens in a new tab)</span>
                    </Link>
                )}
                <Link to="/" className={styles.link} onClick={onNavigate}>
                    <ArrowLeft size={18} aria-hidden />
                    Back to the map
                </Link>
            </div>
        </nav>
    );
}

interface AdminSidebarProps {
    nav: NavModel;
    /** Phone drawer state; on desktop the sidebar is always shown. */
    drawerOpen: boolean;
    onDrawerOpenChange: (open: boolean) => void;
}

/** The left navigation: a fixed column on desktop, a drawer that slides in from the left on phones. */
export function AdminSidebar({ nav, drawerOpen, onDrawerOpenChange }: AdminSidebarProps) {
    return (
        <>
            <aside className={styles.sidebar}>
                <SidebarNav nav={nav} />
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
                                <SidebarNav nav={nav} onNavigate={() => onDrawerOpenChange(false)} />
                            </Drawer.Content>
                        </Drawer.Popup>
                    </Drawer.Viewport>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    );
}
