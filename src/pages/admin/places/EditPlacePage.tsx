import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePlace, useUpdatePlace } from "@/api/hooks";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { PublicPageLink } from "@/pages/admin/shell/PublicPageLink";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { PlaceStepForm } from "./PlaceStepForm";

/** /admin/places/:id/edit: the place's details, any step; saving stays here. */
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
    const save = useUpdatePlace(id);

    if (place.error instanceof ApiError && place.error.status === 404) return <NotFoundPage />;
    if (place.isPending) return <LoadingState />;
    if (!place.data) return <ErrorState message="Could not load this place." onRetry={() => void place.refetch()} />;

    const submit = async (payload: PlacePayload) => {
        await save.mutateAsync(payload);
        toast.success("Place saved.");
    };

    return (
        <AdminPage
            title="Details"
            description={`What guests see about ${place.data.name}, and where it is on the map.`}
            breadcrumbs={[
                { label: "Places", to: "/admin/places" },
                { label: place.data.name, to: `/admin/places/${id}` },
                { label: "Details" },
            ]}
            actions={<PublicPageLink to={`/places/${id}`} />}
        >
            <PlaceStepForm mode="edit" initial={place.data} onSubmit={submit} cancelTo={`/admin/places/${id}`} />
        </AdminPage>
    );
}
