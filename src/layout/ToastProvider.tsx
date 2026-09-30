import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import styles from "./Toast.module.scss";

type ToastKind = "success" | "error" | "info";

interface MessageToast {
    id: number;
    type: "message";
    kind: ToastKind;
    text: string;
}
interface ConfirmToast {
    id: number;
    type: "confirm";
    title: string;
    text: string;
    confirmLabel: string;
    resolve: (answer: boolean) => void;
}
type Toast = MessageToast | ConfirmToast;

export interface ConfirmOptions {
    title: string;
    text: string;
    confirmLabel?: string;
}

export interface ToastApi {
    success: (text: string) => void;
    error: (text: string) => void;
    info: (text: string) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastApi | null>(null);

const KIND_CLASS: Record<ToastKind, string> = { success: styles.success, error: styles.error, info: styles.info };

const MESSAGE_DURATION_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

    const push = useCallback(
        (kind: ToastKind, text: string) => {
            const id = nextId.current++;
            setToasts((list) => [...list, { id, type: "message", kind, text }]);
            setTimeout(() => dismiss(id), MESSAGE_DURATION_MS);
        },
        [dismiss],
    );

    const confirm = useCallback(
        (options: ConfirmOptions) =>
            new Promise<boolean>((resolve) => {
                const id = nextId.current++;
                setToasts((list) => [
                    ...list,
                    {
                        id,
                        type: "confirm",
                        title: options.title,
                        text: options.text,
                        confirmLabel: options.confirmLabel ?? "Confirm",
                        resolve: (answer) => {
                            dismiss(id);
                            resolve(answer);
                        },
                    },
                ]);
            }),
        [dismiss],
    );

    const api = useMemo<ToastApi>(
        () => ({
            success: (text) => push("success", text),
            error: (text) => push("error", text),
            info: (text) => push("info", text),
            confirm,
        }),
        [push, confirm],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className={styles.viewport} aria-live="polite">
                {toasts.map((toast) =>
                    toast.type === "message" ? (
                        <div key={toast.id} role="status" className={cn(styles.toast, KIND_CLASS[toast.kind])}>
                            {toast.text}
                        </div>
                    ) : (
                        <div
                            key={toast.id}
                            role="alertdialog"
                            aria-label={toast.title}
                            className={cn(styles.toast, styles.confirm)}
                        >
                            <p className={styles.confirmTitle}>{toast.title}</p>
                            <p className={styles.confirmText}>{toast.text}</p>
                            <div className={styles.confirmActions}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => toast.resolve(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={styles.confirmButton}
                                    onClick={() => toast.resolve(true)}
                                >
                                    {toast.confirmLabel}
                                </button>
                            </div>
                        </div>
                    ),
                )}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}
