import { CheckCircle2, Inbox, Mic2, Plus } from "lucide-react";
import { Link } from "react-router";

import { usePerformerRequests, useRespondToPerformerInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import overview from "@/pages/admin/shared/overview.module.scss";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPerformerRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { StatCard } from "@/pages/admin/shell/StatCard";

/** /admin/performers: the manager's performers and the lineup invitations waiting for an answer. */
export function PerformersOverviewPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <AdminPage
                title="Performers"
                description="The artists you represent and the events that would like them in their lineup."
                actions={
                    <ButtonLink to="/admin/performers/new">
                        <Plus size={16} aria-hidden />
                        New performer
                    </ButtonLink>
                }
            >
                <Overview />
            </AdminPage>
        </RequireRole>
    );
}

function Overview() {
    const { performers, requests, isPending, isError, refetch } = usePerformerRequests();
    const respond = useRespondToPerformerInvitation();

    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState message="Could not load your performers." onRetry={refetch} />;

    const all = requests.map(fromPerformerRequest);
    const pending = sortRequests(all.filter((request) => request.state === "PENDING"));
    const accepted = all.filter((request) => request.state === "ACCEPTED").length;

    return (
        <>
            <div className={overview.stats}>
                <StatCard label="Performers" value={performers.length} icon={Mic2} to="/admin/performers/list" />
                <StatCard
                    label="Waiting for your answer"
                    value={pending.length}
                    icon={Inbox}
                    to="/admin/performers/requests"
                    attention={pending.length > 0}
                />
                <StatCard label="Accepted slots" value={accepted} icon={CheckCircle2} hint="Lineups you agreed to" />
            </div>
            <section className={overview.section} aria-labelledby="performers-pending">
                <div className={overview.sectionHead}>
                    <h2 id="performers-pending" className={overview.sectionTitle}>
                        Needs your answer
                    </h2>
                    <Link to="/admin/performers/requests" className={overview.sectionLink}>
                        All requests
                    </Link>
                </div>
                <RequestList
                    requests={pending.slice(0, 5)}
                    showTarget
                    onRespond={(request, answer) =>
                        respond.mutateAsync({ performerId: request.targetId, eventPlanId: request.eventPlanId, answer })
                    }
                    empty="Nothing is waiting for your answer."
                />
            </section>
        </>
    );
}
