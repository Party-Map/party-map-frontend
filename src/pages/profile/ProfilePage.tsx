import { useAuth } from "@/auth/provider";
import { buttonClass, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import text from "@/components/typography.module.scss";
import { PageShell } from "@/layout/PageShell";
import { RequireAuth } from "@/layout/RequireAuth";

import styles from "./ProfilePage.module.scss";

const EMPTY_VALUE = "—";

/** Up to two upper-case initials of a display name, "?" when there are none. */
function initialsOf(name: string): string {
    const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);
    return initials || "?";
}

/** The signed-in user's account details, with a link to the Keycloak account console. */
export function ProfilePage() {
    const { user, isAdmin, accountUrl } = useAuth();
    const name = user?.name ?? "Unknown user";
    const email = user?.email ?? "Not provided";

    return (
        <RequireAuth message="You need to be signed in to view your profile.">
            <PageShell>
                <Card padded>
                    <h1 className={text.pageTitle}>Profile</h1>

                    <div className={styles.header}>
                        <div className={styles.avatar} aria-hidden>
                            {initialsOf(name)}
                        </div>
                        <div className={styles.identity}>
                            <p className={styles.name}>{name}</p>
                            <p className={styles.email}>{email}</p>
                        </div>
                        <div className={styles.actions}>
                            <a href={accountUrl("/profile")} className={buttonClass({ size: "sm" })}>
                                Edit profile
                            </a>
                            {isAdmin && (
                                <ButtonLink to="/admin" size="sm">
                                    Admin page
                                </ButtonLink>
                            )}
                        </div>
                    </div>

                    <dl className={styles.fields}>
                        <div>
                            <dt className={styles.fieldLabel}>Display name</dt>
                            <dd className={styles.fieldValue}>{user?.givenName ?? EMPTY_VALUE}</dd>
                        </div>
                        {/* Accounts made before display names (2026-10-03) may still carry a family name. */}
                        {user?.familyName ? (
                            <div>
                                <dt className={styles.fieldLabel}>Family name</dt>
                                <dd className={styles.fieldValue}>{user.familyName}</dd>
                            </div>
                        ) : null}
                    </dl>
                </Card>
            </PageShell>
        </RequireAuth>
    );
}
