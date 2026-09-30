import {
    type InputHTMLAttributes,
    type ReactNode,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
    useId,
} from "react";

import { cx } from "@/lib/cx";

import styles from "./forms.module.css";

interface FieldProps {
    label: string;
    hint?: string;
    error?: string | null;
    /** Optional element rendered on the right of the label (a small action, for instance). */
    aside?: ReactNode;
    children: (id: string) => ReactNode;
}

/** Label + control + hint/error. The render function receives the id to link label and control. */
export function Field({ label, hint, error, aside, children }: FieldProps) {
    const id = useId();
    return (
        <div className={styles.field}>
            <div className={styles.labelRow}>
                <label htmlFor={id} className={styles.label}>
                    {label}
                </label>
                {aside}
            </div>
            {children(id)}
            {hint && <p className={styles.hint}>{hint}</p>}
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cx(styles.control, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cx(styles.control, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={cx(styles.control, className)} {...rest}>
            {children}
        </select>
    );
}

export function FormError({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <p className={styles.error} role="alert">
            {message}
        </p>
    );
}

export const formStyles = styles;
