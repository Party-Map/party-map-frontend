import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { EVENT_TYPES, type EventPlanPayload, type EventType } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Input, Select, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import text from "@/components/typography.module.scss";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { endsAfterStart, toDateTimeLocalInput } from "@/lib/format";
import adminStyles from "@/pages/admin/shared/admin.module.scss";
import { DateTimeRangeFields } from "@/pages/admin/shared/DateTimeRangeFields";
import { imageUrl, links, optionalText, requiredText } from "@/pages/admin/shared/formSchemas";
import { ImageUrlField } from "@/pages/admin/shared/ImageUrlField";
import { LinksInput } from "@/pages/admin/shared/LinksInput";

const schema = z
    .object({
        title: requiredText("Title"),
        kind: z.custom<EventType>(),
        startDateTime: requiredText("Start"),
        endDateTime: requiredText("End"),
        description: optionalText,
        price: requiredText("Price"),
        links,
        image: imageUrl,
    })
    .refine((values) => endsAfterStart(values.startDateTime, values.endDateTime), {
        path: ["endDateTime"],
        message: "The end must be after the start.",
    });

type FormValues = z.input<typeof schema>;

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

function toPayload(values: z.output<typeof schema>): EventPlanPayload {
    return {
        title: values.title,
        kind: values.kind,
        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime,
        description: values.description,
        price: values.price,
        ...(values.links.length ? { links: values.links } : {}),
        image: values.image || null,
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
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues, unknown, z.output<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: toFormValues(initialValues),
    });

    const submit = handleSubmit(async (values) => {
        try {
            await onSubmit(toPayload(values));
        } catch {
            setError("root", { message: "Could not save the event plan. Please try again." });
        }
    });

    return (
        <>
            <div className={adminStyles.header}>
                <h1 className={text.pageTitle}>{title}</h1>
            </div>

            <form onSubmit={(e) => void submit(e)} className={formStyles.form} noValidate>
                <Field label="Title" error={errors.title?.message}>
                    {(id) => <Input id={id} {...register("title")} aria-invalid={Boolean(errors.title)} />}
                </Field>

                <Field label="Event kind">
                    {(id) => (
                        <Select id={id} {...register("kind")}>
                            {EVENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {EVENT_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>

                <Controller
                    control={control}
                    name="startDateTime"
                    render={({ field: start }) => (
                        <Controller
                            control={control}
                            name="endDateTime"
                            render={({ field: end }) => (
                                <DateTimeRangeFields
                                    start={start.value}
                                    end={end.value}
                                    error={errors.startDateTime?.message ?? errors.endDateTime?.message}
                                    onChange={(nextStart, nextEnd) => {
                                        start.onChange(nextStart);
                                        end.onChange(nextEnd);
                                    }}
                                />
                            )}
                        />
                    )}
                />

                <Field label="Description">{(id) => <Textarea id={id} {...register("description")} />}</Field>

                <Field label="Price" error={errors.price?.message}>
                    {(id) => (
                        <div className={formStyles.prefixed}>
                            <span className={formStyles.prefix}>HUF</span>
                            <Input
                                id={id}
                                type="number"
                                min={0}
                                placeholder="0"
                                {...register("price")}
                                aria-invalid={Boolean(errors.price)}
                            />
                        </div>
                    )}
                </Field>

                <Controller
                    control={control}
                    name="links"
                    render={({ field }) => <LinksInput value={field.value} onChange={field.onChange} />}
                />

                <Controller
                    control={control}
                    name="image"
                    render={({ field, fieldState }) => (
                        <ImageUrlField
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                        />
                    )}
                />

                <FormError message={errors.root?.message ?? null} />

                <div className={formStyles.actions}>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving…" : submitLabel}
                    </Button>
                    <Button variant="secondary" onClick={() => void navigate(-1)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                </div>
            </form>
        </>
    );
}
