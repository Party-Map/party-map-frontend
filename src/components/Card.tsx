import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./Card.module.scss";

type CardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode; padded?: boolean };

/** The shared translucent surface used for every content block. */
export function Card({ children, padded = false, className, ...rest }: CardProps) {
    return (
        <div className={cn(styles.card, padded && styles.padded, className)} {...rest}>
            {children}
        </div>
    );
}

export function CardBody({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
    return (
        <div className={cn(styles.padded, className)} {...rest}>
            {children}
        </div>
    );
}
