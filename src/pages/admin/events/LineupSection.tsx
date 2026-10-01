import { Clock, UserPlus, X } from "lucide-react";
import { useState } from "react";

import { messageOf } from "@/api/client";
import { useAddLineupInvitation, useDeleteLineupInvitation } from "@/api/hooks";
import type { EventPlan, EventPlanLineupInvitation, Performer } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Select } from "@/components/Field";
import { clampDateTimeRange, formatDateTime, formatDateTimeRange, toDateTimeLocalInput } from "@/lib/format";
import { toast } from "@/lib/toast";
import card from "@/pages/admin/shared/card.module.scss";
import { DateTimeRangeFields } from "@/pages/admin/shared/DateTimeRangeFields";
import { InvitationStateChip } from "@/pages/admin/shared/StatusChip";

import styles from "./LineupSection.module.scss";

interface LineupSectionProps {
    plan: EventPlan;
    lineup: EventPlanLineupInvitation[];
    performers: Performer[];
}

/** The invited performers with their slots and answers, and a form to invite one more. */
export function LineupSection({ plan, lineup, performers }: LineupSectionProps) {
    const remove = useDeleteLineupInvitation(plan.id);
    const ordered = lineup.toSorted((a, b) => a.startTime.localeCompare(b.startTime));

    const withdraw = async (invitation: EventPlanLineupInvitation) => {
        try {
            await remove.mutateAsync(invitation.performer.id);
            toast.success(`${invitation.performer.name} removed from the lineup.`);
        } catch (error) {
            toast.error(messageOf(error, "Could not remove the performer. Please try again."));
        }
    };

    return (
        <section className={card.card} aria-labelledby="plan-lineup">
            <div className={card.head}>
                <h2 id="plan-lineup" className={card.title}>
                    Lineup
                </h2>
                <span className={card.subtitle}>Optional. Each performer answers their invitation.</span>
            </div>

            {ordered.length === 0 ? (
                <p className={styles.empty}>No performers invited yet.</p>
            ) : (
                <ul className={styles.list} aria-label="Invited performers">
                    {ordered.map((invitation) => (
                        <li key={invitation.performer.id} className={styles.item}>
                            <span className={styles.who}>
                                <span className={styles.name}>{invitation.performer.name}</span>
                                <span className={styles.slot}>
                                    <Clock size={14} aria-hidden />
                                    {formatDateTimeRange(invitation.startTime, invitation.endTime)}
                                </span>
                            </span>
                            <InvitationStateChip state={invitation.state} />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void withdraw(invitation)}
                                disabled={remove.isPending}
                                aria-label={`Remove ${invitation.performer.name} from the lineup`}
                            >
                                <X size={16} aria-hidden />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <InviteForm
                // A new form after each invitation, so its fields start over.
                key={lineup.length}
                plan={plan}
                performers={performers.filter((p) => !lineup.some((i) => i.performer.id === p.id))}
            />
        </section>
    );
}

function InviteForm({ plan, performers }: { plan: EventPlan; performers: Performer[] }) {
    const add = useAddLineupInvitation(plan.id);
    const [performerId, setPerformerId] = useState("");
    const [start, setStart] = useState(() => toDateTimeLocalInput(plan.startDateTime));
    const [end, setEnd] = useState(() => toDateTimeLocalInput(plan.endDateTime));
    const [error, setError] = useState<string | null>(null);

    const invite = async () => {
        if (!performerId || !start || !end) {
            setError("Choose a performer and their time slot.");
            return;
        }
        setError(null);
        const slot = clampDateTimeRange(start, end, plan.startDateTime, plan.endDateTime);
        try {
            await add.mutateAsync({ performerId, ...slot });
            toast.success("Invitation sent to the performer.");
        } catch (caught) {
            setError(messageOf(caught, "Could not send the invitation. Please try again."));
        }
    };

    return (
        <div className={styles.form}>
            <h3 className={styles.formTitle}>Invite a performer</h3>
            <Field label="Performer">
                {(id) => (
                    <Select id={id} value={performerId} onChange={(e) => setPerformerId(e.target.value)}>
                        <option value="">{performers.length ? "Choose a performer" : "Everyone is invited"}</option>
                        {performers.map((performer) => (
                            <option key={performer.id} value={performer.id}>
                                {performer.genre ? `${performer.name} (${performer.genre})` : performer.name}
                            </option>
                        ))}
                    </Select>
                )}
            </Field>
            <DateTimeRangeFields
                start={start}
                end={end}
                min={toDateTimeLocalInput(plan.startDateTime)}
                max={toDateTimeLocalInput(plan.endDateTime)}
                onChange={(nextStart, nextEnd) => {
                    const slot = clampDateTimeRange(nextStart, nextEnd, plan.startDateTime, plan.endDateTime);
                    setStart(slot.startTime);
                    setEnd(slot.endTime);
                }}
            />
            <p className={styles.hint}>
                The slot must fit between {formatDateTime(plan.startDateTime)} and {formatDateTime(plan.endDateTime)}.
            </p>
            <FormError message={error} />
            <div>
                <Button variant="secondary" onClick={() => void invite()} disabled={add.isPending}>
                    <UserPlus size={16} aria-hidden />
                    {add.isPending ? "Sending…" : "Send invitation"}
                </Button>
            </div>
        </div>
    );
}
