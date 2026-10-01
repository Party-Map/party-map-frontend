import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, MapPin } from "lucide-react";

import type { EventPlan } from "@/api/types";
import card from "@/pages/admin/shared/card.module.scss";
import { InvitationStateChip } from "@/pages/admin/shared/StatusChip";

import { InvitePlace } from "./InvitePlace";
import styles from "./VenueSection.module.scss";

const STATE_TEXT = {
    PENDING: "The place manager has not answered yet.",
    ACCEPTED: "The place agreed to host the event.",
    REJECTED: "The place declined. Invite another one.",
} as const;

/** The plan's venue: the invited place and its answer, and inviting a (different) place. */
export function VenueSection({ plan }: { plan: EventPlan }) {
    const invitation = plan.placeInvitation;
    const canReplace = invitation && invitation.state !== "REJECTED";

    return (
        <section className={card.card} aria-labelledby="plan-venue">
            <div className={card.head}>
                <h2 id="plan-venue" className={card.title}>
                    Venue
                </h2>
                <span className={card.subtitle}>One place hosts the event.</span>
            </div>

            {invitation && (
                <div className={styles.current}>
                    <MapPin size={20} aria-hidden className={styles.icon} />
                    <div className={styles.text}>
                        <span className={styles.name}>
                            {invitation.place.name}
                            <InvitationStateChip state={invitation.state} />
                        </span>
                        <span className={styles.address}>
                            {[invitation.place.address, invitation.place.city].filter(Boolean).join(", ")}
                        </span>
                        <span className={styles.state}>{STATE_TEXT[invitation.state]}</span>
                    </div>
                </div>
            )}

            {canReplace ? (
                <Collapsible.Root className={styles.collapsible}>
                    <Collapsible.Trigger className={styles.trigger}>
                        <ChevronRight size={16} aria-hidden className={styles.chevron} />
                        Invite a different place instead
                    </Collapsible.Trigger>
                    <Collapsible.Panel className={styles.panel}>
                        <InvitePlace planId={plan.id} currentPlaceId={invitation.place.id} />
                    </Collapsible.Panel>
                </Collapsible.Root>
            ) : (
                <InvitePlace planId={plan.id} currentPlaceId={invitation?.place.id} />
            )}
        </section>
    );
}
