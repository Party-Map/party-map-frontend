import { ExternalLink } from "lucide-react";
import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePlace, usePlaceInvitations, useRespondToPlaceInvitation, useUpdatePlace } from "@/api/hooks";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import overview from "@/pages/admin/shared/overview.module.scss";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPlaceRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { PlaceStepForm } from "./PlaceStepForm";

/** /admin/places/:id: edit a place (any step) and answer the event requests it received. */
export function EditPlacePage() {
    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <PlaceEditor />
        </RequireRole>
    );
}

function PlaceEditor() {
    const id = useParams<"id">().id ?? "";
    const place = usePlace(id);
    const invitations = usePlaceInvitations(id);
    const save = useUpdatePlace(id);
    const respond = useRespondToPlaceInvitation();

    if (place.error instanceof ApiError && place.error.status === 404) return <NotFoundPage />;
    if (place.isPending || invitations.isPending) return <LoadingState />;
    if (!place.data || !invitations.data) {
        const reload = () => {
            void place.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load this place." onRetry={reload} />;
    }

    const submit = async (payload: PlacePayload) => {
        await save.mutateAsync(payload);
        toast.success("Place saved.");
    };

    return (
        <AdminPage
            title={place.data.name}
            description={[place.data.address, place.data.city].filter(Boolean).join(", ")}
            breadcrumbs={[
                { label: "Places", to: "/admin/places" },
                { label: "My places", to: "/admin/places/list" },
                { label: place.data.name },
            ]}
            actions={
                <ButtonLink to={`/places/${id}`} variant="secondary">
                    <ExternalLink size={16} aria-hidden />
                    View public page
                </ButtonLink>
            }
        >
            <PlaceStepForm mode="edit" initial={place.data} onSubmit={submit} cancelTo="/admin/places/list" />
            <section className={overview.section} aria-labelledby="place-requests">
                <h2 id="place-requests" className={overview.sectionTitle}>
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
        </AdminPage>
    );
}
