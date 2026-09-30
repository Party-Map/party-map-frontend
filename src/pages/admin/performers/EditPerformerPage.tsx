import { useNavigate, useParams } from "react-router";

import { fetchPerformer, fetchPerformerInvitations, updatePerformer } from "@/api/performers";
import type { PerformerPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ErrorState, LoadingState } from "@/components/States";
import { useToast } from "@/layout/ToastProvider";
import { useResource } from "@/lib/hooks/useResource";
import { RequireRole } from "@/pages/admin/RequireRole";
import styles from "@/pages/admin/shared/admin.module.css";

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
    const toast = useToast();
    const performer = useResource(() => fetchPerformer(id), [id]);
    const invitations = useResource(() => fetchPerformerInvitations(id), [id]);

    if (performer.loading || invitations.loading) return <LoadingState />;
    if (!performer.data || !invitations.data) {
        const reload = () => {
            performer.reload();
            invitations.reload();
        };
        return <ErrorState message="Could not load this performer." onRetry={reload} />;
    }

    const handleSubmit = async (payload: PerformerPayload) => {
        const updated = await updatePerformer(id, payload);
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
            <PerformerInvitationRequests performerId={id} requests={invitations.data} onChanged={invitations.reload} />
        </div>
    );
}
