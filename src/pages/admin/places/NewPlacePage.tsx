import { useNavigate } from "react-router";

import { useCreatePlace } from "@/api/hooks";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

import { PlaceStepForm } from "./PlaceStepForm";

/** /admin/places/new: a new place, step by step; afterwards its admin page opens. */
export function NewPlacePage() {
    const navigate = useNavigate();
    const create = useCreatePlace();

    const submit = async (payload: PlacePayload) => {
        const created = await create.mutateAsync(payload);
        toast.success("Place created.");
        void navigate(`/admin/places/${created.id}`);
    };

    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <AdminPage
                title="New place"
                breadcrumbs={[
                    { label: "Places", to: "/admin/places" },
                    { label: "My places", to: "/admin/places/list" },
                    { label: "New place" },
                ]}
            >
                <PlaceStepForm mode="create" onSubmit={submit} cancelTo="/admin/places/list" />
            </AdminPage>
        </RequireRole>
    );
}
