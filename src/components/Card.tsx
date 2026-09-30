import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Card.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode; padded?: boolean };

/** The shared translucent surface used for every content block. */
export function Card({ children, padded = false, className, ...rest }: CardProps) {
    return (
        <div className={cx(styles.card, padded && styles.padded, className)} {...rest}>
            {children}
        </div>
    );
}

export function CardBody({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
    return (
        <div className={cx(styles.padded, className)} {...rest}>
            {children}
        </div>
    );
}
