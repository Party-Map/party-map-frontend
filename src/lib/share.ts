// Sharing a page: the system share sheet where there is one, the clipboard otherwise.
import { toast } from "./toast";

/** Opens the share sheet with the link; without one, copies the link and says so. */
export async function shareOrCopy({ title, url }: { title: string; url: string }): Promise<void> {
    if (typeof navigator.share === "function") {
        try {
            await navigator.share({ title, url });
            return;
        } catch (error) {
            // The user closed the sheet: nothing to do. Anything else falls back to copying.
            if (error instanceof Error && error.name === "AbortError") return;
        }
    }
    try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
    } catch {
        toast.error("Could not copy the link.");
    }
}
