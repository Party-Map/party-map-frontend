// The place form's rules and mappings, kept apart from its steps so they can be tested on their own.
import { z } from "zod";

import type { GeoPoint, Place, PlacePayload } from "@/api/types";
import { imageUrl, links, optionalShortText, optionalText, requiredText, tags } from "@/pages/admin/shared/formSchemas";
import type { SummaryRow } from "@/pages/admin/shared/stepper/StepForm";
import { linkSummary, NONE, orNone } from "@/pages/admin/shared/stepper/summary";

export const placeSchema = z.object({
    name: requiredText("Name"),
    description: optionalText,
    tags,
    address: optionalShortText("Address"),
    city: requiredText("City"),
    location: z.custom<GeoPoint | null>().refine((value) => value !== null, "Pick the place on the map."),
    image: imageUrl,
    links,
});

export type PlaceFormValues = z.input<typeof placeSchema>;

export function toPlaceFormValues(place?: Omit<Place, "id">): PlaceFormValues {
    return {
        name: place?.name ?? "",
        description: place?.description ?? "",
        tags: place?.tags ?? [],
        address: place?.address ?? "",
        city: place?.city ?? "",
        location: place?.location ?? null,
        image: place?.image ?? "",
        links: place?.links ?? [],
    };
}

export function toPlacePayload(values: z.output<typeof placeSchema>): PlacePayload {
    return {
        name: values.name,
        description: values.description,
        tags: values.tags,
        address: values.address,
        city: values.city,
        // The schema refused a missing location.
        location: values.location,
        image: values.image || null,
        ...(values.links.length > 0 ? { links: values.links } : {}),
    };
}

export function placeSummary(values: PlaceFormValues): SummaryRow[] {
    const { location } = values;
    return [
        { stepId: "basics", label: "Name", value: orNone(values.name) },
        { stepId: "basics", label: "Description", value: orNone(values.description) },
        { stepId: "basics", label: "Tags", value: values.tags.length ? values.tags.join(", ") : NONE },
        { stepId: "location", label: "Address", value: orNone(values.address) },
        { stepId: "location", label: "City", value: orNone(values.city) },
        {
            stepId: "location",
            label: "Map position",
            value: location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Not picked yet",
        },
        { stepId: "media", label: "Image", value: orNone(values.image) },
        { stepId: "media", label: "Links", value: linkSummary(values.links) },
    ];
}
