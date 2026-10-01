import type { Link } from "@/api/types";
import { LINK_TYPE_LABELS } from "@/lib/constants";

/** How the review shows an empty optional value. */
export const NONE = "—";

export const orNone = (text: string) => text.trim() || NONE;

/** "Instagram, Website", or the dash. */
export const linkSummary = (links: Link[]) =>
    links.length === 0 ? NONE : links.map((link) => LINK_TYPE_LABELS[link.type]).join(", ");
