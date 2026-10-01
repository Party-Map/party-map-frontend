import { Switch } from "@base-ui/react/switch";
import { useId, useState } from "react";

import { messageOf } from "@/api/client";
import { useChangeUserRole } from "@/api/hooks";
import type { AdminUser } from "@/api/types";
import { MANAGER_ROLES, type ManagerRole, Role, ROLE_LABELS } from "@/auth/roles";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/lib/toast";
import { StatusChip } from "@/pages/admin/shared/StatusChip";

import styles from "./RoleSwitches.module.scss";
import { displayName } from "./users";

/** What each role lets its holder do, completing "Can …" and "will be able to …". */
const ABILITIES: Record<ManagerRole, string> = {
    [Role.PLACE_MANAGER]: "create and edit places and answer the event requests they receive",
    [Role.PERFORMER_MANAGER]: "create and edit performers and answer lineup invitations",
    [Role.EVENT_ORGANIZER]: "plan events, invite places and performers, and publish events to the map",
};

function confirmText(name: string, { role, grant }: Change): string {
    const what = grant ? "will be able to" : "will no longer be able to";
    return `${name} ${what} ${ABILITIES[role]}. The change applies when they next sign in or their session refreshes.`;
}

interface Change {
    role: ManagerRole;
    grant: boolean;
}

/** One switch per manager role; each change is confirmed before it reaches Keycloak. */
export function RoleSwitches({ user }: { user: AdminUser }) {
    const change = useChangeUserRole(user.id);
    const [pending, setPending] = useState<Change | null>(null);
    const name = displayName(user);
    const idBase = useId();

    const confirm = async () => {
        if (!pending) return;
        const { role, grant } = pending;
        setPending(null);
        try {
            await change.mutateAsync({ role, grant });
            toast.success(`${ROLE_LABELS[role]} ${grant ? "granted to" : "revoked from"} ${name}.`);
        } catch (error) {
            toast.error(messageOf(error, "Could not change the role. Please try again."));
        }
    };

    return (
        <>
            <ul className={styles.list}>
                {MANAGER_ROLES.map((role) => {
                    const labelId = `${idBase}-${role}`;
                    const checked = user.roles.includes(role);
                    return (
                        <li key={role} className={styles.row}>
                            <span className={styles.text}>
                                <span id={labelId} className={styles.label}>
                                    {ROLE_LABELS[role]}
                                </span>
                                <span className={styles.description}>Can {ABILITIES[role]}.</span>
                            </span>
                            <Switch.Root
                                className={styles.switch}
                                checked={checked}
                                disabled={change.isPending}
                                aria-labelledby={labelId}
                                onCheckedChange={(next) => setPending({ role, grant: next })}
                            >
                                <Switch.Thumb className={styles.thumb} />
                            </Switch.Root>
                        </li>
                    );
                })}
                {user.roles.includes(Role.PARTYMAP_ADMIN) && (
                    <li className={styles.row}>
                        <span className={styles.text}>
                            <span className={styles.label}>{ROLE_LABELS[Role.PARTYMAP_ADMIN]}</span>
                            <span className={styles.description}>Granted and revoked in Keycloak only.</span>
                        </span>
                        <StatusChip tone="info">Granted</StatusChip>
                    </li>
                )}
            </ul>
            <ConfirmDialog
                open={pending !== null}
                title={pending ? `${pending.grant ? "Grant" : "Revoke"} ${ROLE_LABELS[pending.role]}?` : ""}
                text={pending ? confirmText(name, pending) : ""}
                confirmLabel={pending?.grant ? "Grant role" : "Revoke role"}
                onConfirm={() => void confirm()}
                onCancel={() => setPending(null)}
            />
        </>
    );
}
