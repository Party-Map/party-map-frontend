import { useNavigate, useParams } from "react-router";
import { useToast } from "@/app/ToastProvider";
import { ErrorState, LoadingState } from "@/components/States";
import { RequireRole } from "@/features/admin/RequireRole";
import { fetchPlace, fetchPlaceInvitations, updatePlace } from "@/lib/api/places";
import { Role } from "@/lib/auth/roles";
import { useResource } from "@/lib/hooks/useResource";
import type { PlacePayload } from "@/lib/types";
import { PlaceForm } from "./PlaceForm";
import { PlaceInvitationRequests } from "./PlaceInvitationRequests";
import styles from "@/features/admin/admin.module.css";

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
        navigate(`/places/${updated.id}`);
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
