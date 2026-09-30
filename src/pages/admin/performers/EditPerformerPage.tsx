import { useNavigate, useParams } from "react-router";

import { usePerformer, usePerformerInvitations, useUpdatePerformer } from "@/api/hooks";
import type { PerformerPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import styles from "@/pages/admin/shared/admin.module.scss";

import { PerformerForm } from "./PerformerForm";
import { PerformerInvitationRequests } from "./PerformerInvitationRequests";

/** /admin/performers/:id: edit a performer and answer the lineup invitations it received. */
export function EditPerformerPage() {
    return (
        <RequireRole role={Role.PERFORMER_MANAGER}>
            <PerformerEditor />
        </RequireRole>
    );
}

/** Loads only once the role guard has let the user through. */
function PerformerEditor() {
    const id = useParams<"id">().id ?? "";
    const navigate = useNavigate();
    const performer = usePerformer(id);
    const invitations = usePerformerInvitations(id);
    const save = useUpdatePerformer(id);

    if (performer.isPending || invitations.isPending) return <LoadingState />;
    if (!performer.data || !invitations.data) {
        const reload = () => {
            void performer.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load this performer." onRetry={reload} />;
    }

    const handleSubmit = async (payload: PerformerPayload) => {
        const updated = await save.mutateAsync(payload);
        toast.success("Performer saved.");
        void navigate(`/performers/${updated.id}`);
    };

    return (
        <div className={styles.detail}>
            <PerformerForm
                title="Edit performer"
                submitLabel="Save changes"
                initialValues={performer.data}
                onSubmit={handleSubmit}
            />
            <PerformerInvitationRequests performerId={id} requests={invitations.data} />
        </div>
    );
}
