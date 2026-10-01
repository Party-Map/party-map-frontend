import { usePlaceRequests, useRespondToPlaceInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPlaceRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

/** /admin/places/requests: every event plan that asked to be held at one of the manager's places. */
export function PlaceRequestsPage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <AdminPage
                title="Requests"
                description="Event organizers who would like to hold their event at one of your places."
                breadcrumbs={[{ label: "Places", to: "/admin/places" }, { label: "Requests" }]}
            >
                <Requests />
            </AdminPage>
        </RequireRole>
    );
}

function Requests() {
    const { requests, isPending, isError, refetch } = usePlaceRequests();
    const respond = useRespondToPlaceInvitation();

    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState message="Could not load the requests." onRetry={refetch} />;

    return (
        <RequestList
            requests={sortRequests(requests.map(({ request, place }) => fromPlaceRequest(request, place)))}
            showTarget
            onRespond={(request, answer) =>
                respond.mutateAsync({ placeId: request.targetId, eventPlanId: request.eventPlanId, answer })
            }
            empty="No event organizer has asked for one of your places yet."
        />
    );
}
