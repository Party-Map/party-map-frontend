import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePerformer, usePerformerInvitations, useRespondToPerformerInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPerformerRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /admin/performers/:id/requests: every lineup invitation this performer received. */
export function SinglePerformerRequestsPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <Requests />
        </RequireRole>
    );
}

function Requests() {
    const id = useParams<"id">().id ?? "";
    const performer = usePerformer(id);
    const invitations = usePerformerInvitations(id);
    const respond = useRespondToPerformerInvitation();

    if (performer.error instanceof ApiError && performer.error.status === 404) return <NotFoundPage />;
    if (performer.isPending || invitations.isPending) return <LoadingState />;
    if (!performer.data || !invitations.data) {
        const reload = () => {
            void performer.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load the requests." onRetry={reload} />;
    }

    return (
        <AdminPage
            title="Lineup requests"
            description={`Event organizers who would like ${performer.data.name} in their lineup.`}
            breadcrumbs={[
                { label: "Performers", to: "/admin/performers" },
                { label: performer.data.name, to: `/admin/performers/${id}` },
                { label: "Lineup requests" },
            ]}
        >
            <RequestList
                requests={sortRequests(invitations.data.map(fromPerformerRequest))}
                onRespond={(request, answer) =>
                    respond.mutateAsync({ performerId: id, eventPlanId: request.eventPlanId, answer })
                }
                empty="No event organizer has invited this performer yet."
            />
        </AdminPage>
    );
}
