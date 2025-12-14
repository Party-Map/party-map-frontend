"use client"

import {useContext} from "react"
import {SessionContext} from "@/lib/auth/SessionContextProvider"
import {useRouter} from "next/navigation"
import {PerformerLineupInvitationWithDate} from "@/lib/types";
import {respondToLineupInvitation} from "@/lib/api/performers";
import {dateTimeDisplayFormat} from "@/lib/dateformat";

export default function AdminPerformerLineupInvitationRequests({
                                                              invitationRequests,
                                                              performerId,
                                                          }: {
    invitationRequests: PerformerLineupInvitationWithDate[],
    performerId: string
}) {
    const session = useContext(SessionContext)
    const router = useRouter()

    const handle = async (action: "accept" | "reject", invitation?: PerformerLineupInvitationWithDate) => {
        await respondToLineupInvitation(performerId, invitation?.eventPlanId!!, action, session)
        router.refresh()
    }

    return (
        <div className="w-[30%]">
            <h2 className="mb-3 text-xl font-semibold">Event Requests</h2>

            {invitationRequests.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">No event requests at the moment for this
                    performer</p>
            ) : (
                <>
                    {invitationRequests.map((invitation, idx) => (
                        <div key={idx} className="flex justify-center my-4">
                            <div
                                className="w-full max-w-md rounded-lg border bg-white/90 dark:bg-zinc-950/80 p-4 shadow-sm">
                                <div className="flex flex-row gap-2">
                                    <h3 className="text-lg font-medium mb-2">{invitation.eventPlanTitle}</h3>
                                    {invitation.state === 'ACCEPTED' && (
                                        <span className="text-sm font-semibold text-green-600">Accepted</span>
                                    )}
                                    {invitation.state === 'REJECTED' && (
                                        <span className="text-sm font-semibold text-red-600">Rejected</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{dateTimeDisplayFormat(invitation.startTime, invitation.endTime)}</p>
                                <p className="text-sm text-muted-foreground mb-3">An event organizer has invited this
                                    performer to play at an event. You can accept or reject the invitation.</p>
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
