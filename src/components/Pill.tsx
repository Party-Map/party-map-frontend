import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import { cn } from "@/lib/utils";

import styles from "./Pill.module.scss";

export type PillVariant = "primary" | "secondary";

interface StyleProps {
    variant?: PillVariant;
    icon?: ReactNode;
    className?: string;
}

const VARIANTS: Record<PillVariant, string> = { primary: styles.primary, secondary: styles.secondary };

function pillClass({ variant = "secondary", className }: StyleProps): string {
    return cn(styles.pill, VARIANTS[variant], className);
}

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps & { children: ReactNode };

/** The rounded action of a hero: filled when primary, tinted otherwise, an icon before the label. */
export function PillButton({ variant, icon, className, type = "button", children, ...rest }: PillButtonProps) {
    return (
        <button type={type} className={pillClass({ variant, className })} {...rest}>
            {icon}
            {children}
        </button>
    );
}

export function PillLink({
    variant,
    icon,
    className,
    children,
    ...rest
}: LinkProps & StyleProps & { children: ReactNode }) {
    return (
        <Link className={pillClass({ variant, className })} {...rest}>
            {icon}
            {children}
        </Link>
    );
}

type PillAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & StyleProps & { children: ReactNode };

/** An external link styled as a pill; opens in a new tab. */
export function PillAnchor({ variant, icon, className, children, ...rest }: PillAnchorProps) {
    return (
        <a className={pillClass({ variant, className })} target="_blank" rel="noopener noreferrer" {...rest}>
            {icon}
            {children}
        </a>
    );
}
