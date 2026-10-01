// The document's title and metadata on client-side navigation. The server-rendered shell already carries a page's
// metadata on the first load; this keeps <head> in step as the user moves through the app.
import { useEffect } from "react";

export interface PageMeta {
    title: string;
    description?: string;
    /** The page's path for the canonical URL (and og:url); omitted for pages that have none. */
    canonicalPath?: string;
    image?: string | null;
    noindex?: boolean;
}

export const SITE_NAME = "PartyMap";
export const DEFAULT_META: PageMeta = { title: SITE_NAME, description: "Find your place at the party with PartyMap!" };

/** "<name> | PartyMap" */
export function pageTitle(name: string): string {
    return `${name} | ${SITE_NAME}`;
}

type Tag = ["name" | "property", string];

/** Sets the tag's content, creating it when needed; a null value removes the tag. */
function upsertMeta(doc: Document, [attribute, key]: Tag, value: string | null) {
    const selector = `meta[${attribute}="${key}"]`;
    const existing = doc.head.querySelector<HTMLMetaElement>(selector);
    if (value === null) {
        existing?.remove();
        return;
    }
    const element = existing ?? doc.head.appendChild(doc.createElement("meta"));
    element.setAttribute(attribute, key);
    element.setAttribute("content", value);
}

function upsertCanonical(doc: Document, href: string | null) {
    const existing = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (href === null) {
        existing?.remove();
        return;
    }
    const element = existing ?? doc.head.appendChild(doc.createElement("link"));
    element.rel = "canonical";
    element.href = href;
}

/** Writes the metadata into the document's head; `null` restores the defaults. */
export function applyPageMeta(doc: Document, page: PageMeta | null): void {
    const current = page ?? DEFAULT_META;
    const description = current.description ?? DEFAULT_META.description ?? "";
    const canonical = current.canonicalPath ? `${doc.location.origin}${current.canonicalPath}` : null;
    const image = current.image ?? null;
    doc.title = current.title;
    upsertMeta(doc, ["name", "description"], description);
    upsertCanonical(doc, canonical);
    upsertMeta(doc, ["property", "og:title"], current.title);
    upsertMeta(doc, ["property", "og:description"], description);
    upsertMeta(doc, ["property", "og:url"], canonical);
    upsertMeta(doc, ["property", "og:image"], image);
    upsertMeta(doc, ["name", "twitter:title"], current.title);
    upsertMeta(doc, ["name", "twitter:description"], description);
    upsertMeta(doc, ["name", "twitter:image"], image);
    upsertMeta(doc, ["name", "robots"], current.noindex ? "noindex" : null);
}

/** Keeps the head in step with the page while it is mounted; `null` while the page has nothing to say yet. */
export function usePageMeta(page: PageMeta | null): void {
    const { title, description, canonicalPath, image, noindex } = page ?? {};
    useEffect(() => {
        if (title === undefined) return;
        applyPageMeta(document, { title, description, canonicalPath, image, noindex });
        return () => applyPageMeta(document, null);
    }, [title, description, canonicalPath, image, noindex]);
}
