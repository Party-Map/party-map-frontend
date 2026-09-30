import { useNavigate } from "react-router";

import { useCreatePlace } from "@/api/hooks";
import type { PlacePayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";

import { PlaceForm } from "./PlaceForm";

/** /admin/places/new: create a place, then open its public page. */
export function NewPlacePage() {
    const navigate = useNavigate();
    const create = useCreatePlace();

    const handleSubmit = async (payload: PlacePayload) => {
        const created = await create.mutateAsync(payload);
        toast.success("Place created.");
        void navigate(`/places/${created.id}`);
    };

    return (
        <RequireRole role={Role.PLACE_MANAGER}>
            <PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={handleSubmit} />
        </RequireRole>
    );
}
