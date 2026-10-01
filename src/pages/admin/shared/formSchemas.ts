// Validation shared by the admin forms (zod, through react-hook-form's resolver). Messages are written for the
// person filling in the form.
import { z } from "zod";

import type { Link } from "@/api/types";

/** The API's limit for names, titles, addresses and other one-line text. */
export const SHORT_TEXT_MAX = 255;

/** Text the form cannot do without; surrounding spaces do not count. At most `max` characters. */
export const requiredText = (label: string, max = SHORT_TEXT_MAX) =>
    z.string().trim().min(1, `${label} is required.`).max(max, `${label} can be at most ${max} characters.`);

/** Text that may stay empty (descriptions and bios have no length limit). */
export const optionalText = z.string().trim();

/** One-line text that may stay empty. */
export const optionalShortText = (label: string) =>
    optionalText.max(SHORT_TEXT_MAX, `${label} can be at most ${SHORT_TEXT_MAX} characters.`);

export const TAG_MAX = 40;
export const TAGS_MAX = 20;

/** A place's tags, as TagsInput collects them. */
export const tags = z
    .array(z.string().trim().min(1).max(TAG_MAX, `A tag can be at most ${TAG_MAX} characters.`))
    .max(TAGS_MAX, `Up to ${TAGS_MAX} tags.`);

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

/** An image address, or nothing. */
export const imageUrl = z
    .string()
    .trim()
    .max(2048, "The address can be at most 2048 characters.")
    .refine((value) => value === "" || isHttpUrl(value), "Enter a full http(s) address, or leave it empty.");

/** The social links, as LinksInput builds them. */
export const links = z.array(z.custom<Link>());
