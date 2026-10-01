import { ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import layout from "@/components/layout.module.scss";
import text from "@/components/typography.module.scss";
import { PageShell } from "@/layout/PageShell";

/** Shown to signed-in users without any admin role. */
export function NoAccessCard() {
    return (
        <PageShell>
            <Card padded>
                <h1 className={text.pageTitle}>You have no access to the admin area</h1>
                <p className={text.lead}>
                    Managing places, performers or events needs a manager role. Ask a Party Map admin to grant you one.
                </p>
                <ButtonLink to="/profile" className={layout.action}>
                    Go to Profile
                </ButtonLink>
            </Card>
        </PageShell>
    );
}
