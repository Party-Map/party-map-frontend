import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import type { GeoPoint, Place, PlacePayload } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Input, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import text from "@/components/typography.module.scss";
import type { GeocodeResult } from "@/lib/geocode";
import { reverseGeocode } from "@/lib/geocode";
import { imageUrl, links, optionalText, requiredText } from "@/pages/admin/shared/formSchemas";
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

const schema = z.object({
    name: requiredText("Name"),
    address: optionalText,
    city: requiredText("City"),
    location: z.custom<GeoPoint | null>().refine((value) => value !== null, "Please pick a location on the map."),
    description: optionalText,
    /** Comma separated, as typed. */
    tags: z.string(),
    image: imageUrl,
    links,
});

type FormValues = z.input<typeof schema>;

function toFormValues(values: PlaceFormValues | undefined): FormValues {
    if (!values) {
        return { name: "", address: "", city: "", location: null, description: "", tags: "", image: "", links: [] };
    }
    return {
        name: values.name,
        address: values.address,
        city: values.city,
        location: values.location,
        description: values.description ?? "",
        tags: values.tags.join(", "),
        image: values.image ?? "",
        links: values.links,
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
    const {
        register,
        control,
        handleSubmit,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues, unknown, z.output<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: toFormValues(initialValues),
    });
    const location = useWatch({ control, name: "location" });

    const selectAddress = (result: GeocodeResult) => {
        setValue("address", result.addressLine || result.displayName);
        setValue("location", result.location, { shouldValidate: true });
        if (result.city) setValue("city", result.city);
    };

    const pickLocation = (next: GeoPoint) => {
        setValue("location", next, { shouldValidate: true });
        reverseGeocode(next).then(
            (result) => {
                if (!result) return;
                const line = result.addressLine || result.displayName;
                if (line) setValue("address", line);
                if (result.city) setValue("city", result.city);
            },
            () => {
                // Nominatim unreachable: the pin stays where it was dropped and the address remains editable.
            },
        );
    };

    const submit = handleSubmit(async (values) => {
        const payload: PlacePayload = {
            name: values.name,
            address: values.address,
            city: values.city,
            // The schema refused a missing location, so it is set here.
            location: values.location,
            description: values.description,
            tags: parseTags(values.tags),
            image: values.image || null,
            ...(values.links.length > 0 ? { links: values.links } : {}),
        };
        try {
            await onSubmit(payload);
        } catch {
            setError("root", { message: "Could not save place. Please try again." });
        }
    });

    return (
        <div>
            <h1 className={text.pageTitle}>{title}</h1>

            <form onSubmit={(e) => void submit(e)} className={formStyles.form} noValidate>
                <Field label="Name" error={errors.name?.message}>
                    {(id) => <Input id={id} {...register("name")} aria-invalid={Boolean(errors.name)} />}
                </Field>

                <Controller
                    control={control}
                    name="address"
                    render={({ field }) => (
                        <Field label="Address">
                            {(id) => (
                                <AddressSearchInput
                                    id={id}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onSelect={selectAddress}
                                />
                            )}
                        </Field>
                    )}
                />

                <Field label="City" error={errors.city?.message}>
                    {(id) => <Input id={id} {...register("city")} aria-invalid={Boolean(errors.city)} />}
                </Field>

                <div className={formStyles.field}>
                    <div className={formStyles.labelRow}>
                        <span className={formStyles.label}>Location on map</span>
                        <span className={formStyles.hint}>Click on the map to place the marker</span>
                    </div>
                    <LocationMapPicker value={location} onChange={pickLocation} />
                    {location && (
                        <p className={formStyles.hint}>
                            Lat: {location.latitude.toFixed(5)} · Lng: {location.longitude.toFixed(5)}
                        </p>
                    )}
                    <FormError message={errors.location?.message ?? null} />
                </div>

                <Field label="Description">{(id) => <Textarea id={id} {...register("description")} />}</Field>

                <Field label="Tags" hint="Separate tags with commas.">
                    {(id) => <Input id={id} {...register("tags")} placeholder="bar, terrace, techno, cheap drinks…" />}
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
        </div>
    );
}
