import { ExternalLink } from "lucide-react";
import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import {
    usePerformer,
    usePerformerInvitations,
    useRespondToPerformerInvitation,
    useUpdatePerformer,
} from "@/api/hooks";
import type { PerformerPayload } from "@/api/types";
import { Role } from "@/auth/roles";
import { ButtonLink } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/States";
import { toast } from "@/lib/toast";
import { RequireRole } from "@/pages/admin/RequireRole";
import overview from "@/pages/admin/shared/overview.module.scss";
import { RequestList } from "@/pages/admin/shared/RequestList";
import { fromPerformerRequest, sortRequests } from "@/pages/admin/shared/requests";
import { AdminPage } from "@/pages/admin/shell/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { PerformerStepForm } from "./PerformerStepForm";

/** /admin/performers/:id: edit a performer (any step) and answer the lineup invitations it received. */
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
    const invitations = usePerformerInvitations(id);
    const save = useUpdatePerformer(id);
    const respond = useRespondToPerformerInvitation();

    if (performer.error instanceof ApiError && performer.error.status === 404) return <NotFoundPage />;
    if (performer.isPending || invitations.isPending) return <LoadingState />;
    if (!performer.data || !invitations.data) {
        const reload = () => {
            void performer.refetch();
            void invitations.refetch();
        };
        return <ErrorState message="Could not load this performer." onRetry={reload} />;
    }

    const submit = async (payload: PerformerPayload) => {
        await save.mutateAsync(payload);
        toast.success("Performer saved.");
    };

    return (
        <AdminPage
            title={performer.data.name}
            description={performer.data.genre}
            breadcrumbs={[
                { label: "Performers", to: "/admin/performers" },
                { label: "My performers", to: "/admin/performers/list" },
                { label: performer.data.name },
            ]}
            actions={
                <ButtonLink to={`/performers/${id}`} variant="secondary">
                    <ExternalLink size={16} aria-hidden />
                    View public page
                </ButtonLink>
            }
        >
            <PerformerStepForm
                mode="edit"
                initial={performer.data}
                onSubmit={submit}
                cancelTo="/admin/performers/list"
            />
            <section className={overview.section} aria-labelledby="performer-requests">
                <h2 id="performer-requests" className={overview.sectionTitle}>
                    Lineup requests
                </h2>
                <RequestList
                    requests={sortRequests(invitations.data.map(fromPerformerRequest))}
                    onRespond={(request, answer) =>
                        respond.mutateAsync({ performerId: id, eventPlanId: request.eventPlanId, answer })
                    }
                    empty="No lineup requests for this performer at the moment."
                />
            </section>
        </AdminPage>
    );
}
