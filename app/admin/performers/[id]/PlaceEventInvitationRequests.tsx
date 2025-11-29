"use client"

import {useContext} from "react"
import {SessionContext} from "@/lib/auth/session-provider"
import {useRouter} from "next/navigation"
import {EventPlanPlaceInvitationWithDate} from "@/lib/types";
import {dateTimeDisplayFormat} from "@/lib/dateformat";
import {respondToEventInvitation} from "@/lib/api/places";

export default function PlaceEventInvitationRequests({invitationRequests, placeId}:
                                                     {
                                                         invitationRequests: EventPlanPlaceInvitationWithDate[],
                                                         placeId: string
                                                     }
) {
    const session = useContext(SessionContext)
    const router = useRouter()


    const handle = async (action: "accept" | "reject", invitation?: EventPlanPlaceInvitationWithDate) => {
        respondToEventInvitation(placeId, invitation?.eventPlanId!!, action, session).then(() => {
            router.refresh()
        })
    }

    return (
        <div className="w-[30%]">
            <h2 className="mb-3 text-xl font-semibold">Event Requests</h2>

            {invitationRequests.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">No event requests a the moment for this
                    place</p>
            ) : (
                <>
                    {invitationRequests.map((invitation, idx) => (
                        <div key={idx} className="flex justify-center my-4">
                            <div
                                className="w-full max-w-md rounded-lg border bg-white/90 dark:bg-zinc-950/80 p-4 shadow-sm">
                                <div className="flex flex-row gap-2">
                                    <h3 className="text-lg font-medium mb-2">{invitation.title}</h3>
                                    {invitation.state === 'ACCEPTED' && (
                                        <span className="text-sm font-semibold text-green-600">Accepted</span>
                                    )}
                                    {invitation.state === 'REJECTED' && (
                                        <span className="text-sm font-semibold text-red-600">Rejected</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{dateTimeDisplayFormat(invitation.startDateTime, invitation.endDateTime)}</p>
                                <p className="text-sm text-muted-foreground mb-3">An event organizer has invited this
                                    place to host an event. You can accept or reject the invitation.</p>
                                <div className="flex gap-3">
                                    <button
                                        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60"
                                        onClick={() => handle("accept", invitation)}
                                        disabled={invitation.state == 'ACCEPTED'}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
                                        onClick={() => handle("reject", invitation)}
                                        disabled={invitation.state == 'REJECTED'}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}
