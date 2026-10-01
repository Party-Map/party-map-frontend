import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import { cn } from "@/lib/utils";

import styles from "./Chip.module.scss";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Whether the filter the chip stands for is on. */
    pressed?: boolean;
    icon?: ReactNode;
    children: ReactNode;
};

/** A toggle for one filter value; its pressed state is announced, so it reads as "Jazz, pressed". */
export function Chip({ pressed = false, icon, className, type = "button", children, ...rest }: ChipProps) {
    return (
        <button
            type={type}
            aria-pressed={pressed}
            className={cn(styles.chip, pressed && styles.pressed, className)}
            {...rest}
        >
            {icon}
            {children}
        </button>
    );
}

/** A chip that navigates (a tag leading to the places filtered by it, for instance). */
export function ChipLink({ icon, className, children, ...rest }: LinkProps & { icon?: ReactNode }) {
    return (
        <Link className={cn(styles.chip, className)} {...rest}>
            {icon}
            {children}
        </Link>
    );
}

/** A wrapping row of chips, named for assistive technology. */
export function ChipRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div role="group" aria-label={label} className={cn(styles.row, className)}>
            {children}
        </div>
    );
}
