// The admin area's domains (one per role) and their sidebar sections. The shell's switcher, sidebar and index
// redirect all read this table, so a new admin feature is one entry here plus its routes.
import {
    CalendarDays,
    ClipboardList,
    FilePen,
    Inbox,
    LayoutDashboard,
    List,
    type LucideIcon,
    MapPin,
    Mic2,
    Radio,
    ShieldCheck,
    Users,
} from "lucide-react";
import { matchPath } from "react-router";

import { Role } from "@/auth/roles";

export interface AdminSection {
    id: string;
    label: string;
    to: string;
    icon: LucideIcon;
    /**
     * Route patterns that count as this section (detail and form pages included). Static patterns win over ones with
     * parameters, so `/admin/places/requests` is Requests even though `/admin/places/:id` would also match it.
     */
    matches: string[];
}

/** One section of a single place's or performer's own admin area, at `<basePath>/<id>/<path>`. */
export interface EntitySection {
    id: string;
    label: string;
    icon: LucideIcon;
    /** "" for the entity's overview. */
    path: string;
}

/**
 * A domain whose items (a manager's places or performers) each get their own admin area, chosen with a second
 * switcher in the header, like a zone inside an account.
 */
export interface EntityScope {
    kind: "place" | "performer";
    /** "Place": names the item in the sidebar. */
    noun: string;
    allLabel: string;
    newLabel: string;
    /** The item's page on the public site (opened in a new tab). */
    publicPath: (id: string) => string;
    sections: EntitySection[];
}

export type AdminDomainId = "places" | "performers" | "events" | "platform";

export interface AdminDomain {
    id: AdminDomainId;
    role: Role;
    label: string;
    description: string;
    icon: LucideIcon;
    basePath: string;
    sections: AdminSection[];
    entity?: EntityScope;
}

function entitySections(requestsLabel: string): EntitySection[] {
    return [
        { id: "overview", label: "Overview", icon: LayoutDashboard, path: "" },
        { id: "requests", label: requestsLabel, icon: Inbox, path: "requests" },
        { id: "edit", label: "Details", icon: FilePen, path: "edit" },
    ];
}

export const ADMIN_DOMAINS: readonly AdminDomain[] = [
    {
        id: "places",
        role: Role.PLACE_MANAGER,
        label: "Places",
        description: "Venues you manage",
        icon: MapPin,
        basePath: "/admin/places",
        sections: [
            {
                id: "overview",
                label: "Overview",
                to: "/admin/places",
                icon: LayoutDashboard,
                matches: ["/admin/places"],
            },
            {
                id: "list",
                label: "My places",
                to: "/admin/places/list",
                icon: List,
                matches: ["/admin/places/list", "/admin/places/new"],
            },
            {
                id: "requests",
                label: "Requests",
                to: "/admin/places/requests",
                icon: Inbox,
                matches: ["/admin/places/requests"],
            },
        ],
        entity: {
            kind: "place",
            noun: "Place",
            allLabel: "All places",
            newLabel: "New place",
            publicPath: (id) => `/places/${id}`,
            sections: entitySections("Event requests"),
        },
    },
    {
        id: "performers",
        role: Role.PERFORMER_MANAGER,
        label: "Performers",
        description: "Artists you represent",
        icon: Mic2,
        basePath: "/admin/performers",
        sections: [
            {
                id: "overview",
                label: "Overview",
                to: "/admin/performers",
                icon: LayoutDashboard,
                matches: ["/admin/performers"],
            },
            {
                id: "list",
                label: "My performers",
                to: "/admin/performers/list",
                icon: List,
                matches: ["/admin/performers/list", "/admin/performers/new"],
            },
            {
                id: "requests",
                label: "Requests",
                to: "/admin/performers/requests",
                icon: Inbox,
                matches: ["/admin/performers/requests"],
            },
        ],
        entity: {
            kind: "performer",
            noun: "Performer",
            allLabel: "All performers",
            newLabel: "New performer",
            publicPath: (id) => `/performers/${id}`,
            sections: entitySections("Lineup requests"),
        },
    },
    {
        id: "events",
        role: Role.EVENT_ORGANIZER,
        label: "Events",
        description: "Plans and published events",
        icon: CalendarDays,
        basePath: "/admin/events",
        sections: [
            {
                id: "overview",
                label: "Overview",
                to: "/admin/events",
                icon: LayoutDashboard,
                matches: ["/admin/events"],
            },
            {
                id: "plans",
                label: "Event plans",
                to: "/admin/events/plans",
                icon: ClipboardList,
                matches: ["/admin/events/plans", "/admin/events/plans/*"],
            },
            {
                id: "live",
                label: "Live events",
                to: "/admin/events/live",
                icon: Radio,
                matches: ["/admin/events/live"],
            },
        ],
    },
    {
        id: "platform",
        role: Role.PARTYMAP_ADMIN,
        label: "Platform",
        description: "Users and their roles",
        icon: ShieldCheck,
        basePath: "/admin/platform",
        sections: [
            {
                id: "users",
                label: "Users",
                to: "/admin/platform/users",
                icon: Users,
                matches: ["/admin/platform/users", "/admin/platform/users/*"],
            },
        ],
    },
];

/** The domains the user's roles unlock, in display order. */
export function domainsForRoles(roles: readonly Role[]): AdminDomain[] {
    return ADMIN_DOMAINS.filter((domain) => roles.includes(domain.role));
}

/** The domain a path belongs to, if any. */
export function domainForPath(pathname: string): AdminDomain | undefined {
    return ADMIN_DOMAINS.find((domain) => pathname === domain.basePath || pathname.startsWith(`${domain.basePath}/`));
}

const isStatic = (pattern: string) => !pattern.includes(":") && !pattern.includes("*");

/** The section of `domain` that `pathname` shows, preferring an exact static match over a parameter match. */
export function activeSection(domain: AdminDomain, pathname: string): AdminSection | undefined {
    const matching = (staticOnly: boolean) =>
        domain.sections.find((section) =>
            section.matches.some(
                (pattern) => isStatic(pattern) === staticOnly && matchPath({ path: pattern, end: true }, pathname),
            ),
        );
    return matching(true) ?? matching(false);
}

/** Path segments under a domain that are its own pages, not an item's id. */
const RESERVED = new Set(["list", "requests", "new"]);

/** The id of the place or performer whose own admin area `pathname` is in, if any. */
export function entityIdForPath(domain: AdminDomain, pathname: string): string | undefined {
    if (!domain.entity) return undefined;
    const id = matchPath({ path: `${domain.basePath}/:id/*` }, pathname)?.params.id;
    return id && !RESERVED.has(id) ? id : undefined;
}

export function entitySectionPath(domain: AdminDomain, id: string, section: EntitySection): string {
    return `${domain.basePath}/${id}${section.path ? `/${section.path}` : ""}`;
}

/** The section of an item's admin area that `pathname` shows. */
export function activeEntitySection(domain: AdminDomain, id: string, pathname: string): EntitySection | undefined {
    return domain.entity?.sections.find((section) =>
        matchPath({ path: entitySectionPath(domain, id, section), end: true }, pathname),
    );
}
