import { useState } from "react";

import { fetchInvitablePlaces, invitePlace } from "@/api/eventPlans";
import type { ID } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Select } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";
import layout from "@/components/layout.module.scss";
import text from "@/components/typography.module.scss";
import { useToast } from "@/layout/ToastProvider";
import { useResource } from "@/lib/hooks/useResource";

interface InvitePlaceProps {
    planId: ID;
    /** Called after an invitation was sent so the page can reload the plan. */
    onChanged: () => void;
}

/** Pick one of the places that can host this plan and send it an invitation. */
export function InvitePlace({ planId, onChanged }: InvitePlaceProps) {
    const toast = useToast();
    const places = useResource(fetchInvitablePlaces, []);
    const [placeId, setPlaceId] = useState("");
    const [sending, setSending] = useState(false);

    const send = async () => {
        setSending(true);
        try {
            await invitePlace(planId, placeId);
            toast.success("Invitation sent.");
            onChanged();
        } catch {
            toast.error("Could not send the invitation. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={layout.stack}>
            <p className={text.muted}>Select a place and send an invitation for this event plan.</p>

            <Field label="Place">
                {(id) => (
                    <Select
                        id={id}
                        value={placeId}
                        onChange={(e) => setPlaceId(e.target.value)}
                        disabled={places.loading}
                    >
                        <option value="">Choose place to invite</option>
                        {(places.data ?? []).map((place) => (
                            <option key={place.id} value={place.id}>
                                {`${place.name} — ${place.city} (${place.address})`}
                            </option>
                        ))}
                    </Select>
                )}
            </Field>

            {places.error && <FormError message="Could not load the places you can invite." />}

            <div className={formStyles.actions}>
                <Button onClick={send} disabled={!placeId || sending}>
                    {sending ? "Sending…" : "Send Invitation"}
                </Button>
            </div>
        </div>
    );
}
