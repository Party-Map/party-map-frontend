"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {EventPlanCreatePayload} from "@/lib/types"
import {SessionContext} from "@/lib/auth/SessionContextProvider"
import {AdminEventPlanForm} from "@/app/admin/events/AdminEventPlanForm";
import {addEventPlan} from "@/lib/api/event-plan";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1512830414785-9928e23475dc?q=80&w=1170&auto=format&fit=crop"

export default function NewAdminPLanPage() {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: EventPlanCreatePayload) => {
        const created = await addEventPlan(
            {
                ...payload,
                image: payload.image ?? FALLBACK_IMAGE, // No real image DB for now
            },
            session,
        )
        router.push(`/admin/events/${created.id}`)
    }

    return (
        <AdminEventPlanForm
            title="Create new Event plan"
            submitLabel="Create Event plan"
            onSubmit={handleSubmit}
        />
    )
}