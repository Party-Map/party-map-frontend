import { useState } from "react";

import { addLineupInvitation, deleteLineupInvitation, fetchLineupInvitations } from "@/api/eventPlans";
import type { EventPlan, EventPlanLineupInvitation, InvitationState, Performer } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Select } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import { ErrorState, LoadingState } from "@/components/States";
import { clampDateTimeRange, formatDateTime, toDateTimeLocalInput } from "@/lib/dates";
import { useResource } from "@/lib/hooks/useResource";
import adminStyles from "@/pages/admin/shared/admin.module.scss";
import { DateTimeRangeFields } from "@/pages/admin/shared/DateTimeRangeFields";
import { InvitationStateLabel } from "@/pages/admin/shared/InvitationStateLabel";

import styles from "./LineupEditor.module.scss";

interface LineupRow {
    /** Stable identity for React; rows have no id of their own until they are invited. */
    key: number;
    performerId: string;
    startTime: string;
    endTime: string;
    /** null until an invitation was sent for this row. */
    state: InvitationState | null;
}

let rowSequence = 0;

function createRow(row: Omit<LineupRow, "key">): LineupRow {
    rowSequence += 1;
    return { key: rowSequence, ...row };
}

function toRows(invitations: EventPlanLineupInvitation[], plan: EventPlan): LineupRow[] {
    if (invitations.length === 0) return [emptyRow(plan)];
    return invitations.map((invitation) =>
        createRow({
            performerId: invitation.performer.id,
            startTime: toDateTimeLocalInput(invitation.startTime),
            endTime: toDateTimeLocalInput(invitation.endTime),
            state: invitation.state,
        }),
    );
}

function emptyRow(plan: EventPlan): LineupRow {
    return createRow({
        performerId: "",
        startTime: toDateTimeLocalInput(plan.startDateTime),
        endTime: toDateTimeLocalInput(plan.endDateTime),
        state: null,
    });
}

interface LineupEditorProps {
    plan: EventPlan;
    performers: Performer[];
}

/** Invite performers to time slots within the plan; loads the existing invitations first. */
export function LineupEditor({ plan, performers }: LineupEditorProps) {
    const invitations = useResource(() => fetchLineupInvitations(plan.id), [plan.id]);

    return (
        <section className={styles.editor}>
            <h2 className={adminStyles.panelTitle}>Create a line up</h2>
            {invitations.loading && <LoadingState label="Loading lineup invitations…" />}
            {invitations.error && (
                <ErrorState message="Failed to load lineup invitations." onRetry={invitations.reload} />
            )}
            {!invitations.loading && (
                <LineupItems
                    key={plan.id}
                    plan={plan}
                    performers={performers}
                    initialInvitations={invitations.data ?? []}
                />
            )}
        </section>
    );
}

type LineupItemsProps = LineupEditorProps & { initialInvitations: EventPlanLineupInvitation[] };

function LineupItems({ plan, performers, initialInvitations }: LineupItemsProps) {
    const [rows, setRows] = useState(() => toRows(initialInvitations, plan));
    const [error, setError] = useState<string | null>(null);
    const chosen = new Set(rows.map((row) => row.performerId).filter(Boolean));
    const min = toDateTimeLocalInput(plan.startDateTime);
    const max = toDateTimeLocalInput(plan.endDateTime);

    const updateRow = (key: number, patch: Partial<LineupRow>) =>
        setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

    const changeTimes = (key: number, start: string, end: string) =>
        updateRow(key, clampDateTimeRange(start, end, plan.startDateTime, plan.endDateTime));

    const addRow = () => setRows((current) => [...current, emptyRow(plan)]);

    const removeRow = async (row: LineupRow) => {
        if (row.state !== null) {
            try {
                await deleteLineupInvitation(plan.id, row.performerId);
            } catch {
                setError("Failed to delete the lineup invitation.");
                return;
            }
        }
        setError(null);
        setRows((current) => current.filter((r) => r.key !== row.key));
    };

    const invite = async (row: LineupRow) => {
        if (!row.performerId || !row.startTime || !row.endTime) {
            setError("Please select a performer and a valid time range.");
            return;
        }
        const times = clampDateTimeRange(row.startTime, row.endTime, plan.startDateTime, plan.endDateTime);
        setError(null);
        updateRow(row.key, { ...times, state: "PENDING" });
        try {
            await addLineupInvitation(plan.id, { performerId: row.performerId, ...times });
        } catch {
            updateRow(row.key, { state: row.state });
            setError("Failed to send the invitation.");
        }
    };

    return (
        <>
            <FormError message={error} />

            <ul className={styles.list}>
                {rows.map((row) => {
                    const pending = row.state === "PENDING";
                    return (
                        <li key={row.key} className={styles.item}>
                            <Field
                                label="Performer"
                                aside={
                                    <Button variant="ghost" size="sm" onClick={() => removeRow(row)}>
                                        Remove
                                    </Button>
                                }
                            >
                                {(id) => (
                                    <Select
                                        id={id}
                                        value={row.performerId}
                                        disabled={pending}
                                        onChange={(e) => updateRow(row.key, { performerId: e.target.value })}
                                    >
                                        <option value="">-- Select performer --</option>
                                        {performers.map((performer) => (
                                            <option
                                                key={performer.id}
                                                value={performer.id}
                                                disabled={chosen.has(performer.id) && performer.id !== row.performerId}
                                            >
                                                {performer.name}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </Field>

                            <DateTimeRangeFields
                                start={row.startTime}
                                end={row.endTime}
                                min={min}
                                max={max}
                                disabled={pending}
                                onChange={(start, end) => changeTimes(row.key, start, end)}
                            />
                            <p className={formStyles.hint}>
                                Between {formatDateTime(plan.startDateTime)} and {formatDateTime(plan.endDateTime)}
                            </p>

                            <div className={styles.itemFooter}>
                                <span>{row.state && <InvitationStateLabel state={row.state} />}</span>
                                <Button size="sm" onClick={() => invite(row)} disabled={pending}>
                                    Invite
                                </Button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className={styles.addRow}>
                <Button variant="secondary" size="sm" onClick={addRow}>
                    Add item
                </Button>
            </div>
        </>
    );
}
