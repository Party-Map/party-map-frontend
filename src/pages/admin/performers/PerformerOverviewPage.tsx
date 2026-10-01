import { CheckCircle2, Inbox, Pencil, XCircle } from "lucide-react";
import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePerformer, usePerformerInvitations, useRespondToPerformerInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import overview from "@/pages/admin/shared/overview.module.scss";
import { ProfileCard } from "@/pages/admin/shared/ProfileCard";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPerformerRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { PublicPageLink } from "@/pages/admin/shell/PublicPageLink";
import { StatCard } from "@/pages/admin/shell/StatCard";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /admin/performers/:id: one performer's own admin home: lineup invitations and the public profile. */
export function PerformerOverviewPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <Overview />
        </RequireRole>
    );
}

function Overview() {
    const id = useParams<"id">().id ?? "";
    const performer = usePerformer(id);
    const invitations = usePerformerInvitations(id);
    const respond = useRespondToPerformerInvitation();
    const base = `/admin/performers/${id}`;

    if (performer.error instanceof ApiError && performer.error.status === 404) return <NotFoundPage />;
    if (performer.isPending || invitations.isPending) return <LoadingState />;
    if (!performer.data || !invitations.data) {
        const reload = () => {
            void performer.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load this performer." onRetry={reload} />;
    }

    const requests = sortRequests(invitations.data.map(fromPerformerRequest));
    const count = (state: string) => requests.filter((request) => request.state === state).length;
    const pending = requests.filter((request) => request.state === "PENDING");

    return (
        <AdminPage
            title={performer.data.name}
            description={performer.data.genre}
            breadcrumbs={[{ label: "Performers", to: "/admin/performers" }, { label: performer.data.name }]}
            actions={
                <>
                    <PublicPageLink to={`/performers/${id}`} />
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
                <StatCard label="Accepted slots" value={count("ACCEPTED")} icon={CheckCircle2} />
                <StatCard label="Declined" value={count("REJECTED")} icon={XCircle} />
            </div>
            <section className={overview.section} aria-labelledby="performer-pending">
                <div className={overview.sectionHead}>
                    <h2 id="performer-pending" className={overview.sectionTitle}>
                        Needs your answer
                    </h2>
                    <Link to={`${base}/requests`} className={overview.sectionLink}>
                        All lineup requests
                    </Link>
                </div>
                <RequestList
                    requests={pending.slice(0, 5)}
                    onRespond={(request, answer) =>
                        respond.mutateAsync({ performerId: id, eventPlanId: request.eventPlanId, answer })
                    }
                    empty="Nothing is waiting for your answer."
                />
            </section>
            <ProfileCard
                title="Public profile"
                image={performer.data.image}
                imageAlt={performer.data.name}
                text={performer.data.bio}
                emptyText="No bio yet. Fans see the name and the genre only."
                chips={performer.data.genre ? [performer.data.genre] : []}
                links={performer.data.links}
                action={
                    <ButtonLink to={`${base}/edit`} variant="ghost" size="sm">
                        Edit
                    </ButtonLink>
                }
            />
        </AdminPage>
    );
}
