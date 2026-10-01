import { ExternalLink } from "lucide-react";

import { ButtonLink } from "@/components/Button";

/** Opens an item's page on the public site in a new tab, so the admin page stays where it was. */
export function PublicPageLink({ to }: { to: string }) {
    return (
        <ButtonLink to={to} target="_blank" rel="noreferrer" variant="secondary">
            <ExternalLink size={16} aria-hidden />
            View public page
            <span className="sr-only">(opens in a new tab)</span>
        </ButtonLink>
    );
}
