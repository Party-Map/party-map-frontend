import { useFormContext } from "react-hook-form";

import type { Performer, PerformerPayload } from "@/api/types";
import { Field, Input, Textarea } from "@/components/Field";
import { MediaLinksStep } from "@/pages/admin/shared/stepper/MediaLinksStep";
import { type Step, StepForm } from "@/pages/admin/shared/stepper/StepForm";

import {
    type PerformerFormValues,
    performerSchema,
    performerSummary,
    toPerformerFormValues,
    toPerformerPayload,
} from "./performerFormSchema";

function BasicsStep() {
    const {
        register,
        formState: { errors },
    } = useFormContext<PerformerFormValues>();
    return (
        <>
            <Field label="Name" error={errors.name?.message}>
                {(id) => <Input id={id} {...register("name")} aria-invalid={Boolean(errors.name)} />}
            </Field>
            <Field
                label="Genre"
                hint="What organizers search for: techno, house, live act…"
                error={errors.genre?.message}
            >
                {(id) => <Input id={id} {...register("genre")} aria-invalid={Boolean(errors.genre)} />}
            </Field>
            <Field label="Bio" hint="A short introduction for the performer's public page.">
                {(id) => <Textarea id={id} rows={5} {...register("bio")} />}
            </Field>
        </>
    );
}

const STEPS: Step<PerformerFormValues>[] = [
    {
        id: "basics",
        title: "Basics",
        description: "Who the performer is and what they play.",
        fields: ["name", "genre", "bio"],
        render: () => <BasicsStep />,
    },
    {
        id: "media",
        title: "Image & links",
        description: "A profile image and where fans can follow them.",
        fields: ["image", "links"],
        render: () => <MediaLinksStep imageLabel="Profile image URL" />,
    },
];

interface PerformerStepFormProps {
    mode: "create" | "edit";
    initial?: Omit<Performer, "id">;
    onSubmit: (payload: PerformerPayload) => Promise<void>;
    cancelTo: string;
}

/** A performer in two steps (basics, image and links) and a review. */
export function PerformerStepForm({ mode, initial, onSubmit, cancelTo }: PerformerStepFormProps) {
    return (
        <StepForm
            mode={mode}
            schema={performerSchema}
            steps={STEPS}
            defaultValues={toPerformerFormValues(initial)}
            summary={performerSummary}
            onSubmit={(values) => onSubmit(toPerformerPayload(values))}
            submitLabel={mode === "create" ? "Create performer" : "Save changes"}
            cancelTo={cancelTo}
            errorMessage="Could not save the performer. Please try again."
        />
    );
}
