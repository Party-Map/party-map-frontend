import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { GeoPoint, Place, PlacePayload } from "@/api/types";
import { Field, FormError, Input, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import { type GeocodeResult, reverseGeocode } from "@/lib/geocode";
import { MediaLinksStep } from "@/pages/admin/shared/stepper/MediaLinksStep";
import { type Step, StepForm } from "@/pages/admin/shared/stepper/StepForm";
import { TagsInput } from "@/pages/admin/shared/TagsInput";

import { AddressSearchInput } from "./AddressSearchInput";
import { LocationMapPicker } from "./LocationMapPicker";
import { type PlaceFormValues, placeSchema, placeSummary, toPlaceFormValues, toPlacePayload } from "./placeFormSchema";

function BasicsStep() {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<PlaceFormValues>();
    return (
        <>
            <Field label="Name" error={errors.name?.message}>
                {(id) => <Input id={id} {...register("name")} aria-invalid={Boolean(errors.name)} />}
            </Field>
            <Field label="Description" hint="What guests can expect: music, drinks, atmosphere.">
                {(id) => <Textarea id={id} rows={5} {...register("description")} />}
            </Field>
            <Controller
                control={control}
                name="tags"
                render={({ field, fieldState }) => (
                    <Field
                        label="Tags"
                        hint="Press Enter or type a comma after each tag. They help people find the place."
                        error={fieldState.error?.message ?? errors.tags?.[0]?.message}
                    >
                        {(id) => (
                            <TagsInput
                                id={id}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="bar, terrace, techno…"
                                invalid={Boolean(fieldState.error)}
                            />
                        )}
                    </Field>
                )}
            />
        </>
    );
}

function LocationStep() {
    const {
        register,
        control,
        setValue,
        formState: { errors },
    } = useFormContext<PlaceFormValues>();
    const location = useWatch({ control, name: "location" });

    const selectAddress = (result: GeocodeResult) => {
        setValue("address", result.addressLine || result.displayName, { shouldDirty: true });
        setValue("location", result.location, { shouldValidate: true, shouldDirty: true });
        if (result.city) setValue("city", result.city, { shouldValidate: true, shouldDirty: true });
    };

    const pickLocation = (next: GeoPoint) => {
        setValue("location", next, { shouldValidate: true, shouldDirty: true });
        reverseGeocode(next).then(
            (result) => {
                if (!result) return;
                const line = result.addressLine || result.displayName;
                if (line) setValue("address", line, { shouldDirty: true });
                if (result.city) setValue("city", result.city, { shouldValidate: true, shouldDirty: true });
            },
            () => {
                // Nominatim unreachable: the pin stays where it was dropped and the address remains editable.
            },
        );
    };

    return (
        <>
            <Controller
                control={control}
                name="address"
                render={({ field, fieldState }) => (
                    <Field
                        label="Address"
                        hint="Start typing to search; picking a result moves the pin."
                        error={fieldState.error?.message}
                    >
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
                    <span className={formStyles.label}>Position on the map</span>
                    <span className={formStyles.hint}>Click the map to move the pin</span>
                </div>
                <LocationMapPicker value={location} onChange={pickLocation} />
                {location && (
                    <p className={formStyles.hint}>
                        Lat {location.latitude.toFixed(5)} · Lng {location.longitude.toFixed(5)}
                    </p>
                )}
                <FormError message={errors.location?.message ?? null} />
            </div>
        </>
    );
}

const STEPS: Step<PlaceFormValues>[] = [
    {
        id: "basics",
        title: "Basics",
        description: "The name and a few words that make guests want to come.",
        fields: ["name", "description", "tags"],
        render: () => <BasicsStep />,
    },
    {
        id: "location",
        title: "Location",
        description: "Where the place is. The pin decides where it shows on the map.",
        fields: ["address", "city", "location"],
        render: () => <LocationStep />,
    },
    {
        id: "media",
        title: "Image & links",
        description: "A cover image and where people can follow the place.",
        fields: ["image", "links"],
        render: () => <MediaLinksStep />,
    },
];

interface PlaceStepFormProps {
    mode: "create" | "edit";
    initial?: Omit<Place, "id">;
    onSubmit: (payload: PlacePayload) => Promise<void>;
    cancelTo: string;
}

/** A place in three steps (basics, location, image and links) and a review. */
export function PlaceStepForm({ mode, initial, onSubmit, cancelTo }: PlaceStepFormProps) {
    return (
        <StepForm
            mode={mode}
            schema={placeSchema}
            steps={STEPS}
            defaultValues={toPlaceFormValues(initial)}
            summary={placeSummary}
            onSubmit={(values) => onSubmit(toPlacePayload(values))}
            submitLabel={mode === "create" ? "Create place" : "Save changes"}
            cancelTo={cancelTo}
            errorMessage="Could not save the place. Please try again."
        />
    );
}
