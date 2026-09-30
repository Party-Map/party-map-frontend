import { useNavigate } from "react-router";

import { createPlace } from "@/api/places";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { useToast } from "@/layout/ToastProvider";
import { RequireRole } from "@/pages/admin/RequireRole";

import { PlaceForm } from "./PlaceForm";

/** /admin/places/new: create a place, then open its public page. */
export function NewPlacePage() {
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (payload: PlacePayload) => {
        const created = await createPlace(payload);
        toast.success("Place created.");
        void navigate(`/places/${created.id}`);
    };

    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={handleSubmit} />
        </RequireRole>
    );
}
