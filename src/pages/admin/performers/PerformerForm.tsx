import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

import type { Link, Performer, PerformerPayload } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Input, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import text from "@/components/typography.module.scss";
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

interface FormState {
    name: string;
    genre: string;
    bio: string;
    image: string;
    links: Link[];
}

const EMPTY: FormState = { name: "", genre: "", bio: "", image: "", links: [] };

function toFormState(values: PerformerFormValues | undefined): FormState {
    if (!values) return EMPTY;
    return { name: values.name, genre: values.genre, bio: values.bio, image: values.image, links: values.links ?? [] };
}

/** Create/edit form for a performer. */
export function PerformerForm({ title, submitLabel, initialValues, onSubmit }: PerformerFormProps) {
    const navigate = useNavigate();
    const [form, setForm] = useState(() => toFormState(initialValues));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const payload: PerformerPayload = {
            name: form.name.trim(),
            genre: form.genre.trim(),
            bio: form.bio.trim(),
            image: form.image.trim() || null,
            ...(form.links.length > 0 ? { links: form.links } : {}),
        };

        setSubmitting(true);
        try {
            await onSubmit(payload);
        } catch {
            setError("Could not save performer. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h1 className={text.pageTitle}>{title}</h1>

            <form onSubmit={handleSubmit} className={formStyles.form}>
                <Field label="Name">
                    {(id) => (
                        <Input id={id} value={form.name} onChange={(e) => update({ name: e.target.value })} required />
                    )}
                </Field>

                <Field label="Genre">
                    {(id) => (
                        <Input
                            id={id}
                            value={form.genre}
                            onChange={(e) => update({ genre: e.target.value })}
                            placeholder="techno, house, live act…"
                            required
                        />
                    )}
                </Field>

                <Field label="Bio">
                    {(id) => <Textarea id={id} value={form.bio} onChange={(e) => update({ bio: e.target.value })} />}
                </Field>

                <LinksInput value={form.links} onChange={(links) => update({ links })} />

                <ImageUrlField label="Profile image URL" value={form.image} onChange={(image) => update({ image })} />

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
        </div>
    );
}
