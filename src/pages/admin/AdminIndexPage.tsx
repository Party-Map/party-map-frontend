import { Navigate } from "react-router";

import { useAuth } from "@/auth/provider";
import { sectionsForRoles } from "@/layout/adminSections";

/** /admin has no content of its own; it opens the first section the user may manage. */
export function AdminIndexPage() {
    const { roles } = useAuth();
    const first = sectionsForRoles(roles)[0];
    return first ? <Navigate to={first.path} replace /> : null;
}
