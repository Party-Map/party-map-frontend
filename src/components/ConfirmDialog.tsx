// "Are you sure?" before an action that cannot be undone.
import { Button } from "./Button";
import { AlertDialog } from "./primitives";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    text: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    text,
    confirmLabel = "Confirm",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onCancel();
            }}
            title={title}
            description={text}
        >
            <Button variant="secondary" onClick={onCancel}>
                Cancel
            </Button>
            <Button onClick={onConfirm}>{confirmLabel}</Button>
        </AlertDialog>
    );
}
