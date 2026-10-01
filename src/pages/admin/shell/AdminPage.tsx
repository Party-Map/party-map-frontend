import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import styles from "./AdminPage.module.scss";

export interface Crumb {
    label: string;
    /** Omitted for the current page. */
    to?: string;
}

interface AdminPageProps {
    title: string;
    description?: ReactNode;
    /** Buttons on the right of the title (below it on phones). */
    actions?: ReactNode;
    breadcrumbs?: Crumb[];
    children?: ReactNode;
}

/** Every admin page's frame: breadcrumbs, the page's only h1, a description and its actions. */
export function AdminPage({ title, description, actions, breadcrumbs, children }: AdminPageProps) {
    return (
        <div className={styles.page}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb">
                    <ol className={styles.crumbs}>
                        {breadcrumbs.map((crumb, index) => (
                            <li key={`${crumb.label}-${index}`} className={styles.crumb}>
                                {index > 0 && <ChevronRight size={14} aria-hidden className={styles.separator} />}
                                {crumb.to ? (
                                    <Link to={crumb.to} className={styles.crumbLink}>
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span aria-current="page">{crumb.label}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <div className={styles.head}>
                <div className={styles.heading}>
                    <h1 className={styles.title}>{title}</h1>
                    {description && <p className={styles.description}>{description}</p>}
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
            </div>
            {children}
        </div>
    );
}
