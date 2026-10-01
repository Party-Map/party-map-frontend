// The performer form's rules and mappings, kept apart from its steps so they can be tested on their own.
import { z } from "zod";

import type { Performer, PerformerPayload } from "@/api/types";
import { imageUrl, links, optionalText, requiredText } from "@/pages/admin/shared/formSchemas";
import type { SummaryRow } from "@/pages/admin/shared/stepper/StepForm";
import { linkSummary, orNone } from "@/pages/admin/shared/stepper/summary";

export const performerSchema = z.object({
    name: requiredText("Name"),
    genre: requiredText("Genre"),
    bio: optionalText,
    image: imageUrl,
    links,
});

export type PerformerFormValues = z.input<typeof performerSchema>;

export function toPerformerFormValues(performer?: Omit<Performer, "id">): PerformerFormValues {
    return {
        name: performer?.name ?? "",
        genre: performer?.genre ?? "",
        bio: performer?.bio ?? "",
        image: performer?.image ?? "",
        links: performer?.links ?? [],
    };
}

export function toPerformerPayload(values: z.output<typeof performerSchema>): PerformerPayload {
    return {
        name: values.name,
        genre: values.genre,
        bio: values.bio,
        image: values.image || null,
        ...(values.links.length > 0 ? { links: values.links } : {}),
    };
}

export function performerSummary(values: PerformerFormValues): SummaryRow[] {
    return [
        { stepId: "basics", label: "Name", value: orNone(values.name) },
        { stepId: "basics", label: "Genre", value: orNone(values.genre) },
        { stepId: "basics", label: "Bio", value: orNone(values.bio) },
        { stepId: "media", label: "Image", value: orNone(values.image) },
        { stepId: "media", label: "Links", value: linkSummary(values.links) },
    ];
}
