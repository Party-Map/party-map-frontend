import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, type SubmitEvent, useId, useRef, useState } from "react";
import {
    type FieldErrors,
    type FieldPath,
    type FieldValues,
    FormProvider,
    get,
    type Resolver,
    useForm,
} from "react-hook-form";
import { Link } from "react-router";
import type { z } from "zod";

import { messageOf } from "@/api/client";
import { Button, buttonClass } from "@/components/Button";
import { FormError } from "@/components/Field";
import { cn } from "@/lib/utils";

import styles from "./StepForm.module.scss";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";

export interface Step<V extends FieldValues> {
    id: string;
    title: string;
    description?: string;
    /** The fields this step edits: validated on Next, and used to send the user back to a step with an error. */
    fields: FieldPath<V>[];
    /** The step's fields; they read the form through `useFormContext`. */
    render: () => ReactNode;
}

export interface SummaryRow {
    label: string;
    value: ReactNode;
    /** The step that edits this value (the review's Edit button goes there). */
    stepId: string;
}

type Schema = z.ZodType<FieldValues, FieldValues>;

interface StepFormProps<S extends Schema> {
    /** Create unlocks the steps one by one; edit lets the user jump to any step. */
    mode: "create" | "edit";
    schema: S;
    steps: Step<z.input<S>>[];
    defaultValues: z.input<S>;
    /** What the review step lists, from the current values. */
    summary: (values: z.input<S>) => SummaryRow[];
    /** Rejecting keeps the user on the review step with the API's message (or `errorMessage`). */
    onSubmit: (values: z.output<S>) => Promise<void>;
    submitLabel: string;
    cancelTo: string;
    errorMessage: string;
}

const REVIEW_ID = "review";

/**
 * A form split into steps with a final review: Next validates only the current step's fields, the review lists every
 * value with a way back to its step, and saving validates everything again (a failing step is marked and opened).
 * One react-hook-form instance holds every step, so going back never loses input.
 */
export function StepForm<S extends Schema>({
    mode,
    schema,
    steps,
    defaultValues,
    summary,
    onSubmit,
    submitLabel,
    cancelTo,
    errorMessage,
}: StepFormProps<S>) {
    const form = useForm<z.input<S>, unknown, z.output<S>>({
        // zodResolver infers its types from a concrete schema; for a generic one they have to be restated.
        resolver: zodResolver(schema) as unknown as Resolver<z.input<S>, unknown, z.output<S>>,
        defaultValues: defaultValues as never,
        mode: "onTouched",
    });
    const {
        handleSubmit,
        trigger,
        getValues,
        reset,
        setError,
        clearErrors,
        formState: { isDirty, isSubmitting, errors },
    } = form;

    const all = [...steps.map((step) => ({ id: step.id, title: step.title })), { id: REVIEW_ID, title: "Review" }];
    const reviewIndex = steps.length;
    const [current, setCurrent] = useState(0);
    const [reached, setReached] = useState(mode === "edit" ? reviewIndex : 0);
    const [invalid, setInvalid] = useState<string[]>([]);
    const saving = useRef(false);
    const headingId = useId();

    const goTo = (index: number) => {
        if (index > reached) return;
        clearErrors("root");
        setCurrent(index);
    };

    const next = async () => {
        const step = steps[current];
        if (!step) return;
        const valid = step.fields.length === 0 || (await trigger(step.fields, { shouldFocus: true }));
        if (!valid) return;
        setInvalid((ids) => ids.filter((id) => id !== step.id));
        setCurrent(current + 1);
        setReached((was) => Math.max(was, current + 1));
    };

    const saveValid = async (values: z.output<S>) => {
        saving.current = true;
        try {
            await onSubmit(values);
            // Edit pages stay open: the saved values become the new baseline, so leaving no longer asks.
            reset(getValues());
            setInvalid([]);
        } catch (error) {
            setError("root", { message: messageOf(error, errorMessage) });
        } finally {
            saving.current = false;
        }
    };

    const showInvalidSteps = (fieldErrors: FieldErrors<z.input<S>>) => {
        const failing = steps.filter((step) => step.fields.some((field) => get(fieldErrors, field)));
        setInvalid(failing.map((step) => step.id));
        const first = steps.findIndex((step) => step.id === failing[0]?.id);
        if (first >= 0) setCurrent(first);
    };

    const submit = (event: SubmitEvent<HTMLFormElement>) => {
        // Enter in a field means Next on a step and Save on the review.
        if (current < reviewIndex) {
            event.preventDefault();
            void next();
        } else {
            void handleSubmit(saveValid, showInvalidSteps)(event);
        }
    };

    const step = steps[current];
    const position = `Step ${current + 1} of ${all.length}`;

    return (
        <FormProvider {...form}>
            <UnsavedChangesGuard shouldBlock={() => form.formState.isDirty && !saving.current} dirty={isDirty} />
            <div className={styles.layout}>
                <nav aria-label="Form steps" className={styles.indicator}>
                    <p className={styles.position} aria-hidden>
                        {position} · {all[current]?.title}
                    </p>
                    <div className={styles.progress} aria-hidden>
                        <span style={{ width: `${((current + 1) / all.length) * 100}%` }} />
                    </div>
                    <ol className={styles.steps}>
                        {all.map((item, index) => {
                            const isInvalid = invalid.includes(item.id);
                            const done = mode === "create" && index < reached && !isInvalid;
                            const state = isInvalid
                                ? "invalid"
                                : index === current
                                  ? "current"
                                  : done
                                    ? "done"
                                    : "upcoming";
                            return (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={styles.step}
                                        data-state={state}
                                        aria-current={index === current ? "step" : undefined}
                                        disabled={index > reached || isSubmitting}
                                        onClick={() => goTo(index)}
                                    >
                                        <span className={styles.marker} aria-hidden>
                                            {isInvalid ? (
                                                <AlertCircle size={14} />
                                            ) : done && index !== current ? (
                                                <Check size={14} />
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                        <span className={styles.stepTitle}>{item.title}</span>
                                        {isInvalid && <span className="sr-only">(needs attention)</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </nav>

                <form className={styles.panel} onSubmit={submit} noValidate aria-labelledby={headingId}>
                    <div className={styles.panelHead}>
                        <p className={styles.panelPosition}>{position}</p>
                        <h2 id={headingId} className={styles.panelTitle}>
                            {step ? step.title : "Review"}
                        </h2>
                        <p className={styles.panelDescription}>
                            {step ? step.description : "Check everything once more, then save."}
                        </p>
                    </div>

                    <div className={styles.body}>
                        {step ? (
                            // Keyed by step: React must not reuse one step's inputs for the next step's fields.
                            <div key={step.id} className={styles.fields}>
                                {step.render()}
                            </div>
                        ) : (
                            <Review
                                steps={steps}
                                rows={summary(getValues())}
                                invalid={invalid}
                                onEdit={(stepId) => goTo(steps.findIndex((s) => s.id === stepId))}
                            />
                        )}
                        {invalid.length > 0 && current === reviewIndex && (
                            <FormError message="Some steps need attention." />
                        )}
                        <FormError message={errors.root?.message ?? null} />
                    </div>

                    <div className={styles.actions}>
                        <Link to={cancelTo} className={cn(buttonClass({ variant: "ghost" }), styles.cancel)}>
                            Cancel
                        </Link>
                        {current > 0 && (
                            <Button variant="secondary" onClick={() => goTo(current - 1)} disabled={isSubmitting}>
                                <ChevronLeft size={16} aria-hidden />
                                Back
                            </Button>
                        )}
                        {current < reviewIndex ? (
                            <Button type="submit">
                                {current === reviewIndex - 1 ? "Continue to review" : "Next"}
                                <ChevronRight size={16} aria-hidden />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving…" : submitLabel}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </FormProvider>
    );
}

interface ReviewProps<V extends FieldValues> {
    steps: Step<V>[];
    rows: SummaryRow[];
    invalid: string[];
    onEdit: (stepId: string) => void;
}

/** Every value, grouped by the step that edits it. */
function Review<V extends FieldValues>({ steps, rows, invalid, onEdit }: ReviewProps<V>) {
    return (
        <div className={styles.review}>
            {steps.map((step) => (
                <section key={step.id} className={styles.reviewGroup} aria-label={step.title}>
                    <div className={styles.reviewHead}>
                        <h3 className={styles.reviewTitle}>
                            {step.title}
                            {invalid.includes(step.id) && (
                                <span className={styles.reviewInvalid}> · needs attention</span>
                            )}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(step.id)}
                            aria-label={`Edit ${step.title}`}
                        >
                            Edit
                        </Button>
                    </div>
                    <dl className={styles.reviewList}>
                        {rows
                            .filter((row) => row.stepId === step.id)
                            .map((row) => (
                                <div key={row.label} className={styles.reviewRow}>
                                    <dt>{row.label}</dt>
                                    <dd>{row.value}</dd>
                                </div>
                            ))}
                    </dl>
                </section>
            ))}
        </div>
    );
}
