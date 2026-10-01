import { CheckCircle2, Inbox, Pencil, XCircle } from "lucide-react";
import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePlace, usePlaceInvitations, useRespondToPlaceInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import overview from "@/pages/admin/shared/overview.module.scss";
import { ProfileCard } from "@/pages/admin/shared/ProfileCard";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPlaceRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { PublicPageLink } from "@/pages/admin/shell/PublicPageLink";
import { StatCard } from "@/pages/admin/shell/StatCard";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /admin/places/:id: one place's own admin home: its requests at a glance and how it looks to the public. */
export function PlaceOverviewPage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <Overview />
        </RequireRole>
    );
}

function Overview() {
    const id = useParams<"id">().id ?? "";
    const place = usePlace(id);
    const invitations = usePlaceInvitations(id);
    const respond = useRespondToPlaceInvitation();
    const base = `/admin/places/${id}`;

    if (place.error instanceof ApiError && place.error.status === 404) return <NotFoundPage />;
    if (place.isPending || invitations.isPending) return <LoadingState />;
    if (!place.data || !invitations.data) {
        const reload = () => {
            void place.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load this place." onRetry={reload} />;
    }

    const requests = sortRequests(invitations.data.map((request) => fromPlaceRequest(request, place.data)));
    const count = (state: string) => requests.filter((request) => request.state === state).length;
    const pending = requests.filter((request) => request.state === "PENDING");

    return (
        <AdminPage
            title={place.data.name}
            description={[place.data.address, place.data.city].filter(Boolean).join(", ")}
            breadcrumbs={[{ label: "Places", to: "/admin/places" }, { label: place.data.name }]}
            actions={
                <>
                    <PublicPageLink to={`/places/${id}`} />
                    <ButtonLink to={`${base}/edit`}>
                        <Pencil size={16} aria-hidden />
                        Edit details
                    </ButtonLink>
                </>
            }
        >
            <div className={overview.stats}>
                <StatCard
                    label="Waiting for your answer"
                    value={pending.length}
                    icon={Inbox}
                    to={`${base}/requests`}
                    attention={pending.length > 0}
                />
                <StatCard label="Accepted events" value={count("ACCEPTED")} icon={CheckCircle2} />
                <StatCard label="Declined" value={count("REJECTED")} icon={XCircle} />
            </div>
            <section className={overview.section} aria-labelledby="place-pending">
                <div className={overview.sectionHead}>
                    <h2 id="place-pending" className={overview.sectionTitle}>
                        Needs your answer
                    </h2>
                    <Link to={`${base}/requests`} className={overview.sectionLink}>
                        All event requests
                    </Link>
                </div>
                <RequestList
                    requests={pending.slice(0, 5)}
                    onRespond={(request, answer) =>
                        respond.mutateAsync({ placeId: id, eventPlanId: request.eventPlanId, answer })
                    }
                    empty="Nothing is waiting for your answer."
                />
            </section>
            <ProfileCard
                title="Public profile"
                image={place.data.image}
                imageAlt={place.data.name}
                text={place.data.description}
                emptyText="No description yet. Guests see the name and the map pin only."
                chips={place.data.tags}
                links={place.data.links}
                action={
                    <ButtonLink to={`${base}/edit`} variant="ghost" size="sm">
                        Edit
                    </ButtonLink>
                }
            />
        </AdminPage>
    );
}
