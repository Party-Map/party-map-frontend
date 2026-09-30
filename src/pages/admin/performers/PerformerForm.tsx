import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import type { Performer, PerformerPayload } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Input, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import text from "@/components/typography.module.scss";
import { imageUrl, links, optionalText, requiredText } from "@/pages/admin/shared/formSchemas";
import { ImageUrlField } from "@/pages/admin/shared/ImageUrlField";
import { LinksInput } from "@/pages/admin/shared/LinksInput";

export type PerformerFormValues = Omit<Performer, "id">;

interface PerformerFormProps {
    title: string;
    submitLabel: string;
    /** Prefills the form; omit for a blank one. Only read on mount. */
    initialValues?: PerformerFormValues;
    onSubmit: (payload: PerformerPayload) => Promise<void>;
}

const schema = z.object({
    name: requiredText("Name"),
    genre: requiredText("Genre"),
    bio: optionalText,
    image: imageUrl,
    links,
});

type FormValues = z.input<typeof schema>;

function toFormValues(values: PerformerFormValues | undefined): FormValues {
    if (!values) return { name: "", genre: "", bio: "", image: "", links: [] };
    return { name: values.name, genre: values.genre, bio: values.bio, image: values.image ?? "", links: values.links };
}

/** Create/edit form for a performer. */
export function PerformerForm({ title, submitLabel, initialValues, onSubmit }: PerformerFormProps) {
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
        const payload: PerformerPayload = {
            name: values.name,
            genre: values.genre,
            bio: values.bio,
            image: values.image || null,
            ...(values.links.length > 0 ? { links: values.links } : {}),
        };
        try {
            await onSubmit(payload);
        } catch {
            setError("root", { message: "Could not save performer. Please try again." });
        }
    });

    return (
        <div>
            <h1 className={text.pageTitle}>{title}</h1>

            <form onSubmit={(e) => void submit(e)} className={formStyles.form} noValidate>
                <Field label="Name" error={errors.name?.message}>
                    {(id) => <Input id={id} {...register("name")} aria-invalid={Boolean(errors.name)} />}
                </Field>

                <Field label="Genre" error={errors.genre?.message}>
                    {(id) => (
                        <Input
                            id={id}
                            {...register("genre")}
                            placeholder="techno, house, live act…"
                            aria-invalid={Boolean(errors.genre)}
                        />
                    )}
                </Field>

                <Field label="Bio">{(id) => <Textarea id={id} {...register("bio")} />}</Field>

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
                            label="Profile image URL"
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
        </div>
    );
}
