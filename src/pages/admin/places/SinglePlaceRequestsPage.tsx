import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePlace, usePlaceInvitations, useRespondToPlaceInvitation } from "@/api/hooks";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/pages/admin/RequireRole";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPlaceRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** /admin/places/:id/requests: every event plan that asked to be held at this place. */
export function SinglePlaceRequestsPage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <Requests />
        </RequireRole>
    );
}

function Requests() {
    const id = useParams<"id">().id ?? "";
    const place = usePlace(id);
    const invitations = usePlaceInvitations(id);
    const respond = useRespondToPlaceInvitation();

    if (place.error instanceof ApiError && place.error.status === 404) return <NotFoundPage />;
    if (place.isPending || invitations.isPending) return <LoadingState />;
    if (!place.data || !invitations.data) {
        const reload = () => {
            void place.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load the requests." onRetry={reload} />;
    }

    return (
        <AdminPage
            title="Event requests"
            description={`Event organizers who would like to hold their event at ${place.data.name}.`}
            breadcrumbs={[
                { label: "Places", to: "/admin/places" },
                { label: place.data.name, to: `/admin/places/${id}` },
                { label: "Event requests" },
            ]}
        >
            <RequestList
                requests={sortRequests(invitations.data.map((request) => fromPlaceRequest(request, place.data)))}
                onRespond={(request, answer) =>
                    respond.mutateAsync({ placeId: id, eventPlanId: request.eventPlanId, answer })
                }
                empty="No event organizer has asked for this place yet."
            />
        </AdminPage>
    );
}
