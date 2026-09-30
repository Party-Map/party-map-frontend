// Short notices after an action ("Place saved."), shown by sonner's <Toaster> (layout/AppToaster.tsx). Call sites
// use this module, not sonner, so the toast library stays a detail of the app shell.
import { toast as sonner } from "sonner";

export const toast = {
    success: (message: string) => void sonner.success(message),
    error: (message: string) => void sonner.error(message),
    info: (message: string) => void sonner.info(message),
};
