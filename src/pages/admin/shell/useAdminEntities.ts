import { useOwnedPerformers, useOwnedPlaces, usePerformerInvitations, usePlaceInvitations } from "@/api/hooks";
import { useAuth } from "@/auth/provider";
import type { AdminDomain } from "@/pages/admin/domains";

export interface EntityItem {
    id: string;
    name: string;
}

/**
 * The manager's places or performers for the domain in view (for the switcher), and how many requests wait for the
 * selected one (the sidebar badge). Asks nothing for other domains or without the domain's role.
 */
export function useAdminEntities(domain: AdminDomain | undefined, entityId: string | undefined) {
    const { hasRole } = useAuth();
    const kind = domain?.entity && hasRole(domain.role) ? domain.entity.kind : undefined;
    const places = useOwnedPlaces({ enabled: kind === "place" });
    const performers = useOwnedPerformers({ enabled: kind === "performer" });
    const placeRequests = usePlaceInvitations(entityId ?? "", { enabled: kind === "place" && Boolean(entityId) });
    const performerRequests = usePerformerInvitations(entityId ?? "", {
        enabled: kind === "performer" && Boolean(entityId),
    });

    const items: EntityItem[] | undefined =
        kind === "place" ? places.data : kind === "performer" ? performers.data : undefined;
    const requests = kind === "place" ? placeRequests.data : kind === "performer" ? performerRequests.data : undefined;

    return {
        items,
        current: items?.find((item) => item.id === entityId),
        pending: requests?.filter((request) => request.state === "PENDING").length ?? 0,
    };
}
