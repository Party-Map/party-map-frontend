// The event plan form's rules and mappings, kept apart from its steps so they can be tested on their own.
import { z } from "zod";

import type { EventPlanPayload, EventType } from "@/api/types";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { endsAfterStart, formatDateTimeRange, isValidDate, parseDate, toDateTimeLocalInput } from "@/lib/format";
import { imageUrl, links, optionalText, requiredText } from "@/pages/admin/shared/formSchemas";
import type { SummaryRow } from "@/pages/admin/shared/stepper/StepForm";
import { linkSummary, NONE, orNone } from "@/pages/admin/shared/stepper/summary";

export const eventPlanSchema = z
    .object({
        title: requiredText("Title"),
        kind: z.custom<EventType>(),
        description: optionalText,
        startDateTime: requiredText("Start"),
        endDateTime: requiredText("End"),
        price: requiredText("Price").regex(/^\d*$/, "Enter the price in forints, digits only (0 for free)."),
        image: imageUrl,
        links,
    })
    // Only once both are filled: an empty time already has its own "required" message.
    .refine(
        (values) =>
            !values.startDateTime || !values.endDateTime || endsAfterStart(values.startDateTime, values.endDateTime),
        {
            path: ["endDateTime"],
            message: "The end must be after the start.",
        },
    );

export type EventPlanFormValues = z.input<typeof eventPlanSchema>;

export function toEventPlanFormValues(plan?: EventPlanPayload): EventPlanFormValues {
    return {
        title: plan?.title ?? "",
        kind: plan?.kind ?? "PUB",
        description: plan?.description ?? "",
        startDateTime: toDateTimeLocalInput(plan?.startDateTime),
        endDateTime: toDateTimeLocalInput(plan?.endDateTime),
        price: plan?.price ?? "",
        image: plan?.image ?? "",
        links: plan?.links ?? [],
    };
}

export function toEventPlanPayload(values: z.output<typeof eventPlanSchema>): EventPlanPayload {
    return {
        title: values.title,
        kind: values.kind,
        description: values.description,
        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime,
        price: values.price,
        image: values.image || null,
        ...(values.links.length > 0 ? { links: values.links } : {}),
    };
}

export function eventPlanSummary(values: EventPlanFormValues): SummaryRow[] {
    const when =
        values.startDateTime &&
        values.endDateTime &&
        isValidDate(parseDate(values.startDateTime)) &&
        isValidDate(parseDate(values.endDateTime))
            ? formatDateTimeRange(values.startDateTime, values.endDateTime)
            : NONE;
    const price = values.price.trim();
    return [
        { stepId: "basics", label: "Title", value: orNone(values.title) },
        { stepId: "basics", label: "Kind", value: EVENT_TYPE_LABELS[values.kind] },
        { stepId: "basics", label: "Description", value: orNone(values.description) },
        { stepId: "schedule", label: "When", value: when },
        { stepId: "schedule", label: "Price", value: price === "" ? NONE : price === "0" ? "Free" : `${price} HUF` },
        { stepId: "media", label: "Image", value: orNone(values.image) },
        { stepId: "media", label: "Links", value: linkSummary(values.links) },
    ];
}
