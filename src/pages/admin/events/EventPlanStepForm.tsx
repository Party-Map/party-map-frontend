import { Controller, useFormContext } from "react-hook-form";

import { EVENT_TYPES, type EventPlanPayload } from "@/api/types";
import { Field, Input, Select, Textarea } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { DateTimeRangeFields } from "@/pages/admin/shared/DateTimeRangeFields";
import { MediaLinksStep } from "@/pages/admin/shared/stepper/MediaLinksStep";
import { type Step, StepForm } from "@/pages/admin/shared/stepper/StepForm";

import {
    type EventPlanFormValues,
    eventPlanSchema,
    eventPlanSummary,
    toEventPlanFormValues,
    toEventPlanPayload,
} from "./eventPlanFormSchema";

function BasicsStep() {
    const {
        register,
        formState: { errors },
    } = useFormContext<EventPlanFormValues>();
    return (
        <>
            <Field label="Title" error={errors.title?.message}>
                {(id) => <Input id={id} {...register("title")} aria-invalid={Boolean(errors.title)} />}
            </Field>
            <Field label="Kind" hint="Sets the event's colour and badge on the map.">
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
            <Field label="Description" hint="What happens, who it is for, anything guests should know.">
                {(id) => <Textarea id={id} rows={5} {...register("description")} />}
            </Field>
        </>
    );
}

function ScheduleStep() {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<EventPlanFormValues>();
    return (
        <>
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
            <Field label="Entry price" hint="In forints; 0 means free entry." error={errors.price?.message}>
                {(id) => (
                    <div className={formStyles.prefixed}>
                        <span className={formStyles.prefix}>HUF</span>
                        <Input
                            id={id}
                            inputMode="numeric"
                            placeholder="0"
                            {...register("price")}
                            aria-invalid={Boolean(errors.price)}
                        />
                    </div>
                )}
            </Field>
        </>
    );
}

const STEPS: Step<EventPlanFormValues>[] = [
    {
        id: "basics",
        title: "Basics",
        description: "What the event is called and what kind of night it is.",
        fields: ["title", "kind", "description"],
        render: () => <BasicsStep />,
    },
    {
        id: "schedule",
        title: "Time & price",
        description: "When it starts and ends, and what entry costs.",
        fields: ["startDateTime", "endDateTime", "price"],
        render: () => <ScheduleStep />,
    },
    {
        id: "media",
        title: "Image & links",
        description: "A cover image and the event's pages elsewhere.",
        fields: ["image", "links"],
        render: () => <MediaLinksStep />,
    },
];

interface EventPlanStepFormProps {
    mode: "create" | "edit";
    initial?: EventPlanPayload;
    onSubmit: (payload: EventPlanPayload) => Promise<void>;
    cancelTo: string;
}

/** An event plan's details in three steps and a review; the venue and lineup are handled in its workspace. */
export function EventPlanStepForm({ mode, initial, onSubmit, cancelTo }: EventPlanStepFormProps) {
    return (
        <StepForm
            mode={mode}
            schema={eventPlanSchema}
            steps={STEPS}
            defaultValues={toEventPlanFormValues(initial)}
            summary={eventPlanSummary}
            onSubmit={(values) => onSubmit(toEventPlanPayload(values))}
            submitLabel={mode === "create" ? "Create event plan" : "Save changes"}
            cancelTo={cancelTo}
            errorMessage="Could not save the event plan. Please try again."
        />
    );
}
