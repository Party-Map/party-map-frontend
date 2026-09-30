import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";

import type { GeoPoint, Link, Place, PlacePayload } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Input, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import text from "@/components/typography.module.scss";
import type { GeocodeResult } from "@/lib/geocode";
import { reverseGeocode } from "@/lib/geocode";
import { ImageUrlField } from "@/pages/admin/shared/ImageUrlField";
import { LinksInput } from "@/pages/admin/shared/LinksInput";

import { AddressSearchInput } from "./AddressSearchInput";
import { LocationMapPicker } from "./LocationMapPicker";

export type PlaceFormValues = Omit<Place, "id">;

interface PlaceFormProps {
    title: string;
    submitLabel: string;
    /** Prefills the form; omit for a blank one. Only read on mount. */
    initialValues?: PlaceFormValues;
    onSubmit: (payload: PlacePayload) => Promise<void>;
}

interface FormState {
    name: string;
    address: string;
    city: string;
    location: GeoPoint | null;
    description: string;
    /** Comma separated, as typed. */
    tags: string;
    image: string;
    links: Link[];
}

const EMPTY: FormState = {
    name: "",
    address: "",
    city: "",
    location: null,
    description: "",
    tags: "",
    image: "",
    links: [],
};

function toFormState(values: PlaceFormValues | undefined): FormState {
    if (!values) return EMPTY;
    return {
        name: values.name,
        address: values.address,
        city: values.city,
        location: values.location,
        description: values.description,
        tags: values.tags.join(", "),
        image: values.image,
        links: values.links ?? [],
    };
}

function parseTags(input: string): string[] {
    return input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
}

/** Create/edit form for a place; the address search and the map keep each other in sync. */
export function PlaceForm({ title, submitLabel, initialValues, onSubmit }: PlaceFormProps) {
    const navigate = useNavigate();
    const [form, setForm] = useState(() => toFormState(initialValues));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

    const selectAddress = (result: GeocodeResult) => {
        update({
            address: result.addressLine || result.displayName,
            location: result.location,
            ...(result.city ? { city: result.city } : {}),
        });
    };

    const pickLocation = (location: GeoPoint) => {
        update({ location });
        reverseGeocode(location).then(
            (result) => {
                if (!result) return;
                const line = result.addressLine || result.displayName;
                update({ ...(line ? { address: line } : {}), ...(result.city ? { city: result.city } : {}) });
            },
            () => {
                // Nominatim unreachable: the pin stays where it was dropped and the address remains editable.
            },
        );
    };

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!form.location) {
            setError("Please pick a location on the map.");
            return;
        }

        const payload: PlacePayload = {
            name: form.name.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            location: form.location,
            description: form.description.trim(),
            tags: parseTags(form.tags),
            image: form.image.trim() || null,
            ...(form.links.length > 0 ? { links: form.links } : {}),
        };

        setSubmitting(true);
        try {
            await onSubmit(payload);
        } catch {
            setError("Could not save place. Please try again.");
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

                <Field label="Address">
                    {(id) => (
                        <AddressSearchInput
                            id={id}
                            value={form.address}
                            onChange={(address) => update({ address })}
                            onSelect={selectAddress}
                        />
                    )}
                </Field>

                <Field label="City">
                    {(id) => (
                        <Input id={id} value={form.city} onChange={(e) => update({ city: e.target.value })} required />
                    )}
                </Field>

                <div className={formStyles.field}>
                    <div className={formStyles.labelRow}>
                        <span className={formStyles.label}>Location on map</span>
                        <span className={formStyles.hint}>Click on the map to place the marker</span>
                    </div>
                    <LocationMapPicker value={form.location} onChange={pickLocation} />
                    {form.location && (
                        <p className={formStyles.hint}>
                            Lat: {form.location.latitude.toFixed(5)} · Lng: {form.location.longitude.toFixed(5)}
                        </p>
                    )}
                </div>

                <Field label="Description">
                    {(id) => (
                        <Textarea
                            id={id}
                            value={form.description}
                            onChange={(e) => update({ description: e.target.value })}
                        />
                    )}
                </Field>

                <Field label="Tags" hint="Separate tags with commas.">
                    {(id) => (
                        <Input
                            id={id}
                            value={form.tags}
                            onChange={(e) => update({ tags: e.target.value })}
                            placeholder="bar, terrace, techno, cheap drinks…"
                        />
                    )}
                </Field>

                <LinksInput value={form.links} onChange={(links) => update({ links })} />

                <ImageUrlField value={form.image} onChange={(image) => update({ image })} />

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
