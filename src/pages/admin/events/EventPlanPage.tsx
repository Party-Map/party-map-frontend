import { CalendarClock, Pencil, Wallet } from "lucide-react";
import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { useEventPlan, useLineupInvitations, usePerformers } from "@/api/hooks";
import type { EventPlan } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { KindBadge } from "@/components/KindBadge";
import { ErrorState, LoadingState } from "@/components/States";
import { formatDateTimeRange } from "@/lib/format";
import { RequireRole } from "@/pages/admin/RequireRole";
import card from "@/pages/admin/shared/card.module.scss";
import { linkSummary } from "@/pages/admin/shared/stepper/summary";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import styles from "./EventPlanPage.module.scss";
import { LineupSection } from "./LineupSection";
import { planReadiness } from "./planReadiness";
import { PublishButton } from "./PublishButton";
import { PublishChecklist } from "./PublishChecklist";
import { VenueSection } from "./VenueSection";

/** /admin/events/plans/:id: the plan's workspace: details, venue, lineup, and publishing once everything is set. */
export function EventPlanPage() {
    return (
        <RequireRole role={Role.EVENT_ORGANIZER}>
            <Workspace />
        </RequireRole>
    );
}

function Workspace() {
    const { id = "" } = useParams();
    const plan = useEventPlan(id);
    const lineup = useLineupInvitations(id);
    const performers = usePerformers();

    if (plan.error instanceof ApiError && plan.error.status === 404) return <NotFoundPage />;
    if (plan.isPending || lineup.isPending || performers.isPending) return <LoadingState label="Loading event plan…" />;
    if (!plan.data || !lineup.data || !performers.data) {
        const retry = () => {
            void plan.refetch();
            void lineup.refetch();
            void performers.refetch();
        };
        return <ErrorState message="Could not load the event plan." onRetry={retry} />;
    }

    const readiness = planReadiness(plan.data, lineup.data);

    return (
        <AdminPage
            title={plan.data.title}
            description={formatDateTimeRange(plan.data.startDateTime, plan.data.endDateTime)}
            breadcrumbs={[
                { label: "Events", to: "/admin/events" },
                { label: "Event plans", to: "/admin/events/plans" },
                { label: plan.data.title },
            ]}
            actions={
                <>
                    <ButtonLink to={`/admin/events/plans/${id}/edit`} variant="secondary">
                        <Pencil size={16} aria-hidden />
                        Edit details
                    </ButtonLink>
                    <PublishButton plan={plan.data} disabled={!readiness.ready} />
                </>
            }
        >
            <div className={styles.grid}>
                <div className={styles.checklist}>
                    <PublishChecklist readiness={readiness} />
                </div>
                <div className={styles.main}>
                    <VenueSection plan={plan.data} />
                    <LineupSection plan={plan.data} lineup={lineup.data} performers={performers.data} />
                </div>
                <div className={styles.details}>
                    <Details plan={plan.data} id={id} />
                </div>
            </div>
        </AdminPage>
    );
}

function Details({ plan, id }: { plan: EventPlan; id: string }) {
    const price = plan.price?.trim();
    return (
        <section className={card.card} aria-labelledby="plan-details">
            <div className={card.head}>
                <h2 id="plan-details" className={card.title}>
                    Details
                </h2>
                <ButtonLink to={`/admin/events/plans/${id}/edit`} variant="ghost" size="sm">
                    Edit
                </ButtonLink>
            </div>
            <KindBadge kind={plan.kind} size="sm" className={styles.kind} />
            <dl className={styles.facts}>
                <dt>
                    <CalendarClock size={16} aria-label="When" />
                </dt>
                <dd>{formatDateTimeRange(plan.startDateTime, plan.endDateTime)}</dd>
                <dt>
                    <Wallet size={16} aria-label="Price" />
                </dt>
                <dd>{!price ? "No price set" : price === "0" ? "Free entry" : `${price} HUF`}</dd>
            </dl>
            {plan.description && <p className={styles.description}>{plan.description}</p>}
            <p className={styles.links}>Links: {linkSummary(plan.links)}</p>
        </section>
    );
}
