import { Send } from "lucide-react";
import { useState } from "react";

import { messageOf } from "@/api/client";
import { useInvitablePlaces, useInvitePlace } from "@/api/hooks";
import type { ID } from "@/api/types";
import { Button } from "@/components/Button";
import { Field, FormError, Select } from "@/components/Field";
import { toast } from "@/lib/toast";

import styles from "./InvitePlace.module.scss";

interface InvitePlaceProps {
    planId: ID;
    /** The place invited now, left out of the choices. */
    currentPlaceId?: ID | undefined;
}

/** Pick one of the places that can host this plan and send it an invitation (it replaces an earlier one). */
export function InvitePlace({ planId, currentPlaceId }: InvitePlaceProps) {
    const places = useInvitablePlaces();
    const invite = useInvitePlace(planId);
    const [placeId, setPlaceId] = useState("");

    const send = async () => {
        try {
            await invite.mutateAsync(placeId);
            setPlaceId("");
            toast.success("Invitation sent. The place manager will answer it.");
        } catch (error) {
            toast.error(messageOf(error, "Could not send the invitation. Please try again."));
        }
    };

    const choices = (places.data ?? []).filter((place) => place.id !== currentPlaceId);

    return (
        <div className={styles.row}>
            <Field label="Place">
                {(id) => (
                    <Select
                        id={id}
                        value={placeId}
                        onChange={(e) => setPlaceId(e.target.value)}
                        disabled={places.isPending}
                    >
                        <option value="">{places.isPending ? "Loading places…" : "Choose a place"}</option>
                        {choices.map((place) => (
                            <option key={place.id} value={place.id}>
                                {[place.name, place.city].filter(Boolean).join(", ")}
                            </option>
                        ))}
                    </Select>
                )}
            </Field>
            <Button onClick={() => void send()} disabled={!placeId || invite.isPending} className={styles.send}>
                <Send size={16} aria-hidden />
                {invite.isPending ? "Sending…" : "Send invitation"}
            </Button>
            {places.error && <FormError message="Could not load the places you can invite." />}
        </div>
    );
}
