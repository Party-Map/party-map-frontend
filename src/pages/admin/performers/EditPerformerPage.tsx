import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { usePerformer, useUpdatePerformer } from "@/api/hooks";
import type { PerformerPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { PublicPageLink } from "@/pages/admin/shell/PublicPageLink";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { PerformerStepForm } from "./PerformerStepForm";

/** /admin/performers/:id/edit: the performer's details, any step; saving stays here. */
export function EditPerformerPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <PerformerEditor />
        </RequireRole>
    );
}

function PerformerEditor() {
    const id = useParams<"id">().id ?? "";
    const performer = usePerformer(id);
    const save = useUpdatePerformer(id);

    if (performer.error instanceof ApiError && performer.error.status === 404) return <NotFoundPage />;
    if (performer.isPending) return <LoadingState />;
    if (!performer.data) {
        return <ErrorState message="Could not load this performer." onRetry={() => void performer.refetch()} />;
    }

    const submit = async (payload: PerformerPayload) => {
        await save.mutateAsync(payload);
        toast.success("Performer saved.");
    };

    return (
        <AdminPage
            title="Details"
            description={`What fans and organizers see about ${performer.data.name}.`}
            breadcrumbs={[
                { label: "Performers", to: "/admin/performers" },
                { label: performer.data.name, to: `/admin/performers/${id}` },
                { label: "Details" },
            ]}
            actions={<PublicPageLink to={`/performers/${id}`} />}
        >
            <PerformerStepForm
                mode="edit"
                initial={performer.data}
                onSubmit={submit}
                cancelTo={`/admin/performers/${id}`}
            />
        </AdminPage>
    );
}
