// Validation shared by the admin forms (zod, through react-hook-form's resolver). Messages are written for the
// person filling in the form.
import { z } from "zod";

import type { Link } from "@/api/types";

/** Text the form cannot do without; surrounding spaces do not count. */
export const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`);

/** Text that may stay empty. */
export const optionalText = z.string().trim();

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
    .refine((value) => value === "" || isHttpUrl(value), "Enter a full http(s) address, or leave it empty.");

/** The social links, as LinksInput builds them. */
export const links = z.array(z.custom<Link>());
