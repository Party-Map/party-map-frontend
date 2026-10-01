import { useNavigate } from "react-router";

import { useCreatePerformer } from "@/api/hooks";
import type { PerformerPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import { AdminPage } from "@/pages/admin/shell/AdminPage";

import { PerformerStepForm } from "./PerformerStepForm";

/** /admin/performers/new: a new performer, step by step; afterwards its admin page opens. */
export function NewPerformerPage() {
    const navigate = useNavigate();
    const create = useCreatePerformer();

    const submit = async (payload: PerformerPayload) => {
        const created = await create.mutateAsync(payload);
        toast.success("Performer created.");
        void navigate(`/admin/performers/${created.id}`);
    };

    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <AdminPage
                title="New performer"
                breadcrumbs={[
                    { label: "Performers", to: "/admin/performers" },
                    { label: "My performers", to: "/admin/performers/list" },
                    { label: "New performer" },
                ]}
            >
                <PerformerStepForm mode="create" onSubmit={submit} cancelTo="/admin/performers/list" />
            </AdminPage>
        </RequireRole>
    );
}
