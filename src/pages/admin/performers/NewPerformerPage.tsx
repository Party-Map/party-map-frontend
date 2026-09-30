import { useNavigate } from "react-router";

import { createPerformer } from "@/api/performers";
import type { PerformerPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { useToast } from "@/layout/ToastProvider";
import { RequireRole } from "@/pages/admin/RequireRole";

import { PerformerForm } from "./PerformerForm";

/** /admin/performers/new: create a performer, then open its public page. */
export function NewPerformerPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (payload: PerformerPayload) => {
        const created = await createPerformer(payload);
        toast.success("Performer created.");
        void navigate(`/performers/${created.id}`);
    };

    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <PerformerForm title="Create a new performer" submitLabel="Create performer" onSubmit={handleSubmit} />
        </RequireRole>
    );
}
