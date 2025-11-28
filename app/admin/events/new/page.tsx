"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {EventPlanCreatePayload} from "@/lib/types"
import {SessionContext} from "@/lib/auth/session-provider"
import {AdminEventPlanForm} from "@/components/AdminEventPlanForm";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1512830414785-9928e23475dc?q=80&w=1170&auto=format&fit=crop"

export default function NewPerformerPage() {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: EventPlanCreatePayload) => {
        router.push("/")
        // const created = await addEventPlan(
        //     {
        //         ...payload,
        //         image: payload.image ?? FALLBACK_IMAGE, // No real image DB for now
        //     },
        //     session,
        // )
        // router.push(`/event-plans/${created.id}`)
    }

    return (
        <AdminEventPlanForm
            title="Create new Performer"
            submitLabel="Create performer"
            onSubmit={handleSubmit}
        />
    )
}