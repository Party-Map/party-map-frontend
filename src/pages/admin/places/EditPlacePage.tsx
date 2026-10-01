import { useNavigate, useParams } from "react-router";

import { usePlace, usePlaceInvitations, useRespondToPlaceInvitation, useUpdatePlace } from "@/api/hooks";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import styles from "@/pages/admin/shared/admin.module.scss";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPlaceRequest, sortRequests } from "@/pages/admin/shared/requests";

import { PlaceForm } from "./PlaceForm";

/** /admin/places/:id: edit a place and answer the event invitations it received. */
export function EditPlacePage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <PlaceEditor />
        </RequireRole>
    );
}

/** Loads only once the role guard has let the user through. */
function PlaceEditor() {
    const id = useParams<"id">().id ?? "";
    const navigate = useNavigate();
    const place = usePlace(id);
    const invitations = usePlaceInvitations(id);
    const save = useUpdatePlace(id);
    const respond = useRespondToPlaceInvitation();

    if (place.isPending || invitations.isPending) return <LoadingState />;
    if (!place.data || !invitations.data) {
        const reload = () => {
            void place.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load this place." onRetry={reload} />;
    }

    const handleSubmit = async (payload: PlacePayload) => {
        const updated = await save.mutateAsync(payload);
        toast.success("Place saved.");
        void navigate(`/places/${updated.id}`);
    };

    return (
        <div className={styles.detail}>
            <PlaceForm
                title="Edit place"
                submitLabel="Save changes"
                initialValues={place.data}
                onSubmit={handleSubmit}
            />
            <section className={styles.panel} aria-labelledby="place-requests">
                <h2 id="place-requests" className={styles.panelTitle}>
                    Event requests
                </h2>
                <RequestList
                    requests={sortRequests(invitations.data.map((request) => fromPlaceRequest(request, place.data)))}
                    onRespond={(request, answer) =>
                        respond.mutateAsync({ placeId: id, eventPlanId: request.eventPlanId, answer })
                    }
                    empty="No event requests for this place at the moment."
                />
            </section>
        </div>
    );
}
