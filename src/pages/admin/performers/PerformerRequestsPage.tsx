import { usePerformerRequests, useRespondToPerformerInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPerformerRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

/** /admin/performers/requests: every lineup invitation to one of the manager's performers. */
export function PerformerRequestsPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <AdminPage
                title="Requests"
                description="Event organizers who would like one of your performers in their lineup."
                breadcrumbs={[{ label: "Performers", to: "/admin/performers" }, { label: "Requests" }]}
            >
                <Requests />
            </AdminPage>
        </RequireRole>
    );
}

function Requests() {
    const { requests, isPending, isError, refetch } = usePerformerRequests();
    const respond = useRespondToPerformerInvitation();

    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState message="Could not load the requests." onRetry={refetch} />;

    return (
        <RequestList
            requests={sortRequests(requests.map(fromPerformerRequest))}
            showTarget
            onRespond={(request, answer) =>
                respond.mutateAsync({ performerId: request.targetId, eventPlanId: request.eventPlanId, answer })
            }
            empty="No event organizer has invited one of your performers yet."
        />
    );
}
