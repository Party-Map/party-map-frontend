import { RequireAuth } from "@/components/auth/RequireAuth";
import { buttonClass, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/lib/auth/AuthProvider";

import styles from "./ProfilePage.module.css";

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
                    <h1 className="page-title">Profile</h1>

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
                            <dt className={styles.fieldLabel}>Given name</dt>
                            <dd className={styles.fieldValue}>{user?.givenName ?? EMPTY_VALUE}</dd>
                        </div>
                        <div>
                            <dt className={styles.fieldLabel}>Family name</dt>
                            <dd className={styles.fieldValue}>{user?.familyName ?? EMPTY_VALUE}</dd>
                        </div>
                    </dl>
                </Card>
            </PageShell>
        </RequireAuth>
    );
}
