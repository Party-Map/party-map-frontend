import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import { cn } from "@/lib/utils";

import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "bar";
export type ButtonSize = "sm" | "md";

interface StyleProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
    success: styles.success,
    bar: styles.bar,
};
const SIZES: Record<ButtonSize, string> = { sm: styles.sm, md: styles.md };

export function buttonClass({ variant = "primary", size = "md", block = false, className }: StyleProps): string {
    return cn(styles.button, VARIANTS[variant], SIZES[size], block && styles.block, className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps & { children: ReactNode };

export function Button({ variant, size, block, className, type = "button", children, ...rest }: ButtonProps) {
    return (
        <button type={type} className={buttonClass({ variant, size, block, className })} {...rest}>
            {children}
        </button>
    );
}

type ButtonLinkProps = LinkProps & StyleProps & { children: ReactNode };

export function ButtonLink({ variant, size, block, className, children, ...rest }: ButtonLinkProps) {
    return (
        <Link className={buttonClass({ variant, size, block, className })} {...rest}>
            {children}
        </Link>
    );
}
