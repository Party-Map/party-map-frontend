"use client"

import {useContext, useEffect, useState} from "react"
import moment from "moment"
import {EventPlan, InviteItem, Performer} from "@/lib/types"
import {
    addLineupInvitationToEventPlan,
    deleteLineupInvitationFromEventPlan,
    fetchLineupInvitationsForEventPlan
} from "@/lib/api/eventPlan"
import {SessionContext} from "@/lib/auth/session-provider"

type InviteState = "ACCEPTED" | "PENDING" | "REJECTED"

export default function LineupCreator({
                                          performers = [],
                                          eventPlan,
                                      }: {
    performers: Performer[]
    eventPlan: EventPlan
}) {
    const session = useContext(SessionContext)

    const eventPlanId = eventPlan.id

    const startTime = moment(eventPlan.startDateTime).format("HH:mm")
    const endTime = moment(eventPlan.endDateTime).format("HH:mm")

    const globalStart = moment(startTime, "HH:mm")
    const globalEnd = moment(endTime, "HH:mm")

    const [items, setItems] = useState<InviteItem[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [initialError, setInitialError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function loadInitialInvites() {
            try {
                const invitations = await fetchLineupInvitationsForEventPlan(eventPlanId, session)
                if (cancelled) return

                if (invitations.length > 0) {
                    setItems(
                        invitations.map((inv) => ({
                            performerId: inv.performer.id,
                            startTime: moment(inv.startTime, "HH:mm").format("HH:mm"),
                            endTime: moment(inv.endTime, "HH:mm").format("HH:mm"),
                            inviteState: inv.state as InviteState,
                        })),
                    )
                } else {
                    setItems([{performerId: undefined, startTime, endTime}])
                }
            } catch (e) {
                if (!cancelled) {
                    setInitialError("Failed to load lineup invitations")
                    setItems([{performerId: undefined, startTime, endTime}])
                }
            } finally {
                if (!cancelled) {
                    setInitialLoading(false)
                }
            }
        }

        loadInitialInvites()

        return () => {
            cancelled = true
        }
    }, [eventPlanId, session, startTime, endTime])

    function addItem() {
        setItems((prev) => [
            ...prev,
            {
                performerId: undefined,
                startTime,
                endTime,
            },
        ])
    }

    async function removeItem(index: number) {
        const item = items[index]
        if (item?.performerId) {
            try {
                await deleteLineupInvitationFromEventPlan(eventPlanId, item.performerId, session)
            } catch (e) {
                setInitialError("Failed to delete lineup invitation")
            }
        }
        setItems((prev) => prev.filter((_, i) => i !== index))
    }

    function clampToGlobalRange(start: string, end: string) {
        let s = moment(start, "HH:mm")
        let e = moment(end, "HH:mm")

        if (s.isBefore(globalStart)) s = globalStart.clone()
        if (e.isAfter(globalEnd)) e = globalEnd.clone()
        if (e.isBefore(s)) e = s.clone()

        return {
            startTime: s.format("HH:mm"),
            endTime: e.format("HH:mm"),
        }
    }

    function updateItem(index: number, patch: Partial<InviteItem>) {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item
                const next = {...item, ...patch}

                if (patch.startTime || patch.endTime) {
                    const clamped = clampToGlobalRange(
                        patch.startTime ?? next.startTime,
                        patch.endTime ?? next.endTime,
                    )
                    next.startTime = clamped.startTime
                    next.endTime = clamped.endTime
                }

                return next
            }),
        )
    }

    async function sendInvite(item: InviteItem, index: number) {
        if (!item.performerId || !item.startTime || !item.endTime) {
            setInitialError("Please select a performer and valid time range")
            return
        }

        const previousState = item.inviteState

        updateItem(index, {inviteState: "PENDING"})
        setInitialError(null)

        try {
            await addLineupInvitationToEventPlan(
                eventPlanId,
                {
                    performerId: item.performerId,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    state: "PENDING",
                },
                session,
            )
        } catch (e) {
            updateItem(index, {inviteState: previousState})
            setInitialError("Failed to send invitation")
        }
    }

    if (initialLoading) {
        return <div className="w-full max-w-2xl">Loading lineup invitations…</div>
    }

    const selectedPerformerIds = items
        .map((i) => i.performerId)
        .filter((id): id is string => !!id)

    return (
        <div className="w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-3">Create a line up</h2>

            {initialError && (
                <p className="mb-2 text-sm text-red-600">{initialError}</p>
            )}

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="mx-auto w-full max-w-sm rounded-md border p-3 bg-white/90 dark:bg-zinc-950/80"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Performer</label>
                            <button
                                type="button"
                                className="text-sm text-red-600 hover:underline"
                                onClick={() => removeItem(index)}
                            >
                                Remove
                            </button>
                        </div>

                        <div className="mb-2">
                            <select
                                value={item.performerId ?? ""}
                                onChange={(e) =>
                                    updateItem(index, {performerId: e.target.value || undefined})
                                }
                                className="w-full rounded-md border px-2 py-1"
                                disabled={item.inviteState === "PENDING"}
                            >
                                <option value="">-- Select performer --</option>
                                {performers.length === 0 ? (
                                    <option value="" disabled>
                                        Performers not loaded (placeholder)
                                    </option>
                                ) : (
                                    performers.map((p) => {
                                        const isSelectedElsewhere =
                                            selectedPerformerIds.includes(p.id) &&
                                            p.id !== item.performerId
                                        return (
                                            <option
                                                key={p.id}
                                                value={p.id}
                                                disabled={isSelectedElsewhere}
                                            >
                                                {p.name}
                                            </option>
                                        )
                                    })
                                )}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground">
                                    Start time (between {startTime} and {endTime})
                                </label>
                                <input
                                    type="time"
                                    min={startTime}
                                    max={endTime}
                                    value={item.startTime}
                                    onChange={(e) =>
                                        updateItem(index, {startTime: e.target.value})
                                    }
                                    className="w-full rounded-md border px-2 py-1"
                                    disabled={item.inviteState === "PENDING"}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground">
                                    End time (between {startTime} and {endTime})
                                </label>
                                <input
                                    type="time"
                                    min={startTime}
                                    max={endTime}
                                    value={item.endTime}
                                    onChange={(e) =>
                                        updateItem(index, {endTime: e.target.value})
                                    }
                                    className="w-full rounded-md border px-2 py-1"
                                    disabled={item.inviteState === "PENDING"}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                {item.inviteState === "PENDING" && (
                                    <span className="text-sm text-amber-600">
                                        Invitation pending
                                    </span>
                                )}
                                {item.inviteState === "ACCEPTED" && (
                                    <span className="text-sm text-green-600">
                                        Invitation accepted
                                    </span>
                                )}
                                {item.inviteState === "REJECTED" && (
                                    <span className="text-sm text-red-600">
                                        Invitation rejected
                                    </span>
                                )}
                            </div>

                            <div>
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                                    onClick={() => sendInvite(item, index)}
                                    disabled={item.inviteState === "PENDING"}
                                >
                                    Invite
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        onClick={addItem}
                    >
                        Add item
                    </button>
                </div>
            </div>
        </div>
    )
}
