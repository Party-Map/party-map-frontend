import { Link } from "react-router";
import styles from "./AdminListItem.module.css";

type AdminListItemProps = {
    title: string;
    lines?: string[];
    to: string;
    linkLabel?: string;
};

/** Row in an admin list: a title, optional detail lines and a link to the detail page. */
export function AdminListItem({ title, lines = [], to, linkLabel = "View" }: AdminListItemProps) {
    return (
        <li className={styles.item}>
            <div className={styles.text}>
                <p className={styles.title}>{title}</p>
                {lines.map((line, index) => (
                    <p key={index} className={styles.line}>
                        {line}
                    </p>
                ))}
            </div>
            <Link to={to} className={styles.link}>
                {linkLabel}
            </Link>
        </li>
    );
}
