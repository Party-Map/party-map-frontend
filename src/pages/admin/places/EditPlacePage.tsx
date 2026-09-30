import { useNavigate, useParams } from "react-router";

import { fetchPlace, fetchPlaceInvitations, updatePlace } from "@/api/places";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { useToast } from "@/layout/ToastProvider";
import { useResource } from "@/lib/hooks/useResource";
import { RequireRole } from "@/pages/admin/RequireRole";
import styles from "@/pages/admin/shared/admin.module.css";

import { PlaceForm } from "./PlaceForm";
import { PlaceInvitationRequests } from "./PlaceInvitationRequests";

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
    const toast = useToast();
    const place = useResource(() => fetchPlace(id), [id]);
    const invitations = useResource(() => fetchPlaceInvitations(id), [id]);

    if (place.loading || invitations.loading) return <LoadingState />;
    if (!place.data || !invitations.data) {
        const reload = () => {
            place.reload();
            invitations.reload();
        };
        return <ErrorState message="Could not load this place." onRetry={reload} />;
    }

    const handleSubmit = async (payload: PlacePayload) => {
        const updated = await updatePlace(id, payload);
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
            <PlaceInvitationRequests placeId={id} requests={invitations.data} onChanged={invitations.reload} />
        </div>
    );
}
