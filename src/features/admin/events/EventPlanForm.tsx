import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/Button";
import { Field, FormError, formStyles, Input, Select, Textarea } from "@/components/Field";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { toDateTimeLocalInput } from "@/lib/dates";
import { EVENT_TYPES, type EventPlanPayload, type EventType, type Link } from "@/lib/types";

import adminStyles from "../admin.module.css";
import { DateTimeRangeFields } from "../DateTimeRangeFields";
import { ImageUrlField } from "../ImageUrlField";
import { LinksInput } from "../LinksInput";

interface FormValues {
    title: string;
    kind: EventType;
    startDateTime: string;
    endDateTime: string;
    description: string;
    price: string;
    links: Link[];
    image: string;
}

function toFormValues(initial: EventPlanPayload | undefined): FormValues {
    return {
        title: initial?.title ?? "",
        kind: initial?.kind ?? "PUB",
        startDateTime: toDateTimeLocalInput(initial?.startDateTime),
        endDateTime: toDateTimeLocalInput(initial?.endDateTime),
        description: initial?.description ?? "",
        price: initial?.price ?? "",
        links: initial?.links ?? [],
        image: initial?.image ?? "",
    };
}

function toPayload(values: FormValues): EventPlanPayload {
    return {
        title: values.title.trim(),
        kind: values.kind,
        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime,
        description: values.description,
        price: values.price,
        links: values.links.length ? values.links : undefined,
        image: values.image.trim() || null,
    };
}

interface EventPlanFormProps {
    title: string;
    submitLabel: string;
    initialValues?: EventPlanPayload;
    onSubmit: (payload: EventPlanPayload) => Promise<void>;
}

/** Create/edit form for an event plan; the parent decides what happens with the payload. */
export function EventPlanForm({ title, submitLabel, initialValues, onSubmit }: EventPlanFormProps) {
    const navigate = useNavigate();
    const [values, setValues] = useState(() => toFormValues(initialValues));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (patch: Partial<FormValues>) => setValues((current) => ({ ...current, ...patch }));

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await onSubmit(toPayload(values));
        } catch {
            setError("Could not save the event plan. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className={adminStyles.header}>
                <h1 className="page-title">{title}</h1>
            </div>

            <form onSubmit={handleSubmit} className={formStyles.form}>
                <Field label="Title">
                    {(id) => (
                        <Input
                            id={id}
                            value={values.title}
                            onChange={(e) => update({ title: e.target.value })}
                            required
                        />
                    )}
                </Field>

                <Field label="Event kind">
                    {(id) => (
                        <Select
                            id={id}
                            value={values.kind}
                            onChange={(e) => update({ kind: e.target.value as EventType })}
                        >
                            {EVENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {EVENT_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>

                <DateTimeRangeFields
                    start={values.startDateTime}
                    end={values.endDateTime}
                    onChange={(startDateTime, endDateTime) => update({ startDateTime, endDateTime })}
                />

                <Field label="Description">
                    {(id) => (
                        <Textarea
                            id={id}
                            value={values.description}
                            onChange={(e) => update({ description: e.target.value })}
                        />
                    )}
                </Field>

                <Field label="Price">
                    {(id) => (
                        <div className={formStyles.prefixed}>
                            <span className={formStyles.prefix}>HUF</span>
                            <Input
                                id={id}
                                type="number"
                                min={0}
                                placeholder="0"
                                value={values.price}
                                onChange={(e) => update({ price: e.target.value })}
                                required
                            />
                        </div>
                    )}
                </Field>

                <LinksInput value={values.links} onChange={(links) => update({ links })} />

                <ImageUrlField value={values.image} onChange={(image) => update({ image })} />

                <FormError message={error} />

                <div className={formStyles.actions}>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving…" : submitLabel}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(-1)} disabled={submitting}>
                        Cancel
                    </Button>
                </div>
            </form>
        </>
    );
}
