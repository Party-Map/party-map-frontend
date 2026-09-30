// Base UI's headless behaviour (focus trap, portal, Escape, scroll lock) under the app's own classes.
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactNode } from "react";

import styles from "./primitives.module.scss";

interface AlertDialogProps {
    open: boolean;
    /** Called when the dialog asks to close (Escape); leave it out for a dialog only its actions can close. */
    onOpenChange?: (open: boolean) => void;
    title: ReactNode;
    description: ReactNode;
    /** The action buttons, laid out at the bottom right. */
    children: ReactNode;
}

/** A modal that needs an answer: a title, a sentence and the actions. */
export function AlertDialog({ open, onOpenChange, title, description, children }: AlertDialogProps) {
    return (
        <BaseAlertDialog.Root open={open} {...(onOpenChange ? { onOpenChange } : {})}>
            <BaseAlertDialog.Portal>
                <BaseAlertDialog.Backdrop className={styles.backdrop} />
                <BaseAlertDialog.Popup className={styles.popup}>
                    <BaseAlertDialog.Title className={styles.title}>{title}</BaseAlertDialog.Title>
                    <BaseAlertDialog.Description className={styles.description}>
                        {description}
                    </BaseAlertDialog.Description>
                    <div className={styles.actions}>{children}</div>
                </BaseAlertDialog.Popup>
            </BaseAlertDialog.Portal>
        </BaseAlertDialog.Root>
    );
}
