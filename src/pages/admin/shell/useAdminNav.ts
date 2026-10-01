import type { LucideIcon } from "lucide-react";

import { activeEntitySection, activeSection, type AdminDomain, entitySectionPath } from "@/pages/admin/domains";

import type { EntityItem } from "./useAdminEntities";

export interface NavItem {
    id: string;
    label: string;
    to: string;
    icon: LucideIcon;
    current: boolean;
    /** A count that needs attention (pending requests). */
    badge?: number;
}

/** What the sidebar shows: a domain's sections, or one place's or performer's own sections. */
export interface NavModel {
    title: string;
    subtitle: string;
    items: NavItem[];
    /** Back from an item's area to the domain's list. */
    back?: { label: string; to: string };
    /** The item's public page, opened in a new tab. */
    publicHref?: string;
}

interface NavInput {
    domain: AdminDomain | undefined;
    entityId: string | undefined;
    entity: EntityItem | undefined;
    pending: number;
    pathname: string;
}

export function adminNav({ domain, entityId, entity, pending, pathname }: NavInput): NavModel {
    if (!domain) return { title: "", subtitle: "", items: [] };
    const scope = domain.entity;
    if (scope && entityId) {
        const active = activeEntitySection(domain, entityId, pathname);
        return {
            title: entity?.name ?? scope.noun,
            subtitle: scope.noun,
            back: { label: scope.allLabel, to: domain.basePath },
            publicHref: scope.publicPath(entityId),
            items: scope.sections.map((section) => ({
                id: section.id,
                label: section.label,
                to: entitySectionPath(domain, entityId, section),
                icon: section.icon,
                current: section.id === active?.id,
                ...(section.id === "requests" && pending > 0 ? { badge: pending } : {}),
            })),
        };
    }
    const active = activeSection(domain, pathname);
    return {
        title: domain.label,
        subtitle: domain.description,
        items: domain.sections.map((section) => ({
            id: section.id,
            label: section.label,
            to: section.to,
            icon: section.icon,
            current: section.id === active?.id,
        })),
    };
}
