import { CheckCircle2, Inbox, MapPin, Plus } from "lucide-react";
import { Link } from "react-router";

import { usePlaceRequests, useRespondToPlaceInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import overview from "@/pages/admin/shared/overview.module.scss";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPlaceRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { StatCard } from "@/pages/admin/shell/StatCard";

/** /admin/places: how many places the manager has and the event requests waiting for an answer. */
export function PlacesOverviewPage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <AdminPage
                title="Places"
                description="Your venues and the event organizers who would like to host an event at them."
                actions={
                    <ButtonLink to="/admin/places/new">
                        <Plus size={16} aria-hidden />
                        New place
                    </ButtonLink>
                }
            >
                <Overview />
            </AdminPage>
        </RequireRole>
    );
}

function Overview() {
    const { places, requests, isPending, isError, refetch } = usePlaceRequests();
    const respond = useRespondToPlaceInvitation();

    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState message="Could not load your places." onRetry={refetch} />;

    const all = requests.map(({ request, place }) => fromPlaceRequest(request, place));
    const pending = sortRequests(all.filter((request) => request.state === "PENDING"));
    const accepted = all.filter((request) => request.state === "ACCEPTED").length;

    return (
        <>
            <div className={overview.stats}>
                <StatCard label="Places" value={places.length} icon={MapPin} to="/admin/places/list" />
                <StatCard
                    label="Waiting for your answer"
                    value={pending.length}
                    icon={Inbox}
                    to="/admin/places/requests"
                    attention={pending.length > 0}
                />
                <StatCard
                    label="Accepted events"
                    value={accepted}
                    icon={CheckCircle2}
                    hint="Plans you agreed to host"
                />
            </div>
            <section className={overview.section} aria-labelledby="places-pending">
                <div className={overview.sectionHead}>
                    <h2 id="places-pending" className={overview.sectionTitle}>
                        Needs your answer
                    </h2>
                    <Link to="/admin/places/requests" className={overview.sectionLink}>
                        All requests
                    </Link>
                </div>
                <RequestList
                    requests={pending.slice(0, 5)}
                    showTarget
                    onRespond={(request, answer) =>
                        respond.mutateAsync({ placeId: request.targetId, eventPlanId: request.eventPlanId, answer })
                    }
                    empty="Nothing is waiting for your answer."
                />
            </section>
        </>
    );
}
