import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

import styles from "./DataTable.module.scss";

export interface Column<T> {
    id: string;
    header: string;
    cell: (row: T) => ReactNode;
    /** The row's name: a row header, and the link when the table has `rowTo`. Exactly one column should be primary. */
    primary?: boolean;
    /** Left out of the phone card layout. */
    hideOnPhone?: boolean;
    align?: "start" | "end";
}

interface DataTableProps<T> {
    /** Read by screen readers only; the page heading names the table visually. */
    caption: string;
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    /** Makes each row a link (the whole row is clickable, the primary cell is the accessible link). */
    rowTo?: (row: T) => string;
    empty: ReactNode;
}

/**
 * The admin lists: a real table on wide screens, one card per row on phones (each cell labelled by its header).
 */
export function DataTable<T>({ caption, columns, rows, rowKey, rowTo, empty }: DataTableProps<T>) {
    if (rows.length === 0) return <div className={styles.empty}>{empty}</div>;

    return (
        <div className={styles.frame}>
            <table className={styles.table}>
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                scope="col"
                                className={cn(
                                    column.hideOnPhone && styles.hideOnPhone,
                                    column.align === "end" && styles.end,
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const to = rowTo?.(row);
                        return (
                            <tr key={rowKey(row)} className={cn(styles.row, to && styles.linked)}>
                                {columns.map((column) => {
                                    const className = cn(
                                        column.hideOnPhone && styles.hideOnPhone,
                                        column.align === "end" && styles.end,
                                    );
                                    if (column.primary) {
                                        return (
                                            <th key={column.id} scope="row" className={cn(styles.primary, className)}>
                                                {to ? (
                                                    <Link to={to} className={styles.rowLink}>
                                                        {column.cell(row)}
                                                    </Link>
                                                ) : (
                                                    column.cell(row)
                                                )}
                                            </th>
                                        );
                                    }
                                    return (
                                        <td key={column.id} data-label={column.header} className={className}>
                                            {column.cell(row)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
