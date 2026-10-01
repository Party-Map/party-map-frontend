import { Navigate } from "react-router";

import { useAuth } from "@/auth/provider";

import { domainsForRoles } from "./domains";

/** /admin has no content of its own; it opens the first domain the user's roles unlock. */
export function AdminIndexPage() {
    const { roles } = useAuth();
    const first = domainsForRoles(roles)[0];
    return first ? <Navigate to={first.basePath} replace /> : null;
}
