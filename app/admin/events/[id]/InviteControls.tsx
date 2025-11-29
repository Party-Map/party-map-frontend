"use client"

import {useContext, useState} from "react"
import AdminPlaceSelect from "@/components/AdminPlaceSelect"
import type {EventPlan, PlaceAdminListItemData} from "@/lib/types"
import {SessionContext} from "@/lib/auth/session-provider"
import {invitePlace} from "@/lib/api/eventPlan"
import toast from "react-hot-toast";
import {useRouter} from "next/navigation";

type Props = {
    initialEventPlan: EventPlan
}

export default function InviteControls({initialEventPlan}: Props) {
    const session = useContext(SessionContext)
    const [selectedPlace, setSelectedPlace] = useState<PlaceAdminListItemData | null>(null)
    const router = useRouter()

    const handleSend = async () => {
        if (!selectedPlace) return
        try {
            // Use the api helper which wraps the fetch and handles session headers
            await invitePlace(initialEventPlan.id, selectedPlace.id, session)
            // router.push(`/admin/events/${initialEventPlan.id}`)
            router.refresh()

        } catch (e: any) {
            toast.error(`Error: ${e?.message ?? String(e)}`)
        }
    }

    return (
        <div className="flex justify-center w-max">
            <div className="max-w-max">
                <h2 className="mb-6 text-xl font-bold">Invite a place</h2>
                <p className="text-sm text-muted-foreground mb-2">Select a place and send an invitation for this event
                    plan.</p>

                <div className="mb-3">
                    <AdminPlaceSelect
                        value={selectedPlace}
                        onChange={setSelectedPlace}
                        placeholder="Choose place to invite"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="nline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                        onClick={handleSend}

                    >
                        Send Invitation
                    </button>
                </div>
            </div>
        </div>
    )
}
