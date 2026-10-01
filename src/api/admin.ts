// Platform administration (partymap_admin only): the realm's users and their manager roles, kept in Keycloak.
import type { ManagerRole } from "@/auth/roles";

import { client, unwrap } from "./client";
import type { ID } from "./types";

export interface AdminUserQuery {
    /** Part of a username, email, first or last name; empty lists everyone. */
    q?: string;
    /** Zero-based. */
    page: number;
    /** Up to 50. */
    size: number;
}

export const fetchAdminUsers = ({ q, page, size }: AdminUserQuery) =>
    unwrap(client.GET("/api/admin/users", { params: { query: { ...(q ? { q } : {}), page, size } } }));
export const fetchAdminUser = (id: ID) => unwrap(client.GET("/api/admin/users/{id}", { params: { path: { id } } }));
export const grantRole = (id: ID, role: ManagerRole) =>
    unwrap(client.PUT("/api/admin/users/{id}/roles/{role}", { params: { path: { id, role } } }));
export const revokeRole = (id: ID, role: ManagerRole) =>
    unwrap(client.DELETE("/api/admin/users/{id}/roles/{role}", { params: { path: { id, role } } }));
