"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {EventPlan, EventPlanCreatePayload} from "@/lib/types"
import {SessionContext} from "@/lib/auth/session-provider"
import {AdminEventPlanForm} from "@/app/admin/events/AdminEventPlanForm";
import {updateEventPlan} from "@/lib/api/eventPlan";

export default function AdminEventPlanEditForm({initialEventPlan}: { initialEventPlan: EventPlan }) {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: EventPlanCreatePayload) => {
        await updateEventPlan(
            initialEventPlan.id,
            {
                ...payload,
                image: payload.image ?? initialEventPlan.image ?? null,
            },
            session,
        )

        router.push(`/admin/events/`)
    }

    return (
        <AdminEventPlanForm
            title="Edit event plan"
            submitLabel="Save changes"
            initialValues={{
                title: initialEventPlan.title,
                price: initialEventPlan.price,
                kind: initialEventPlan.kind,
                description: initialEventPlan.description ?? "",
                image: initialEventPlan.image ?? null,
                links: initialEventPlan.links ?? [],
                startDateTime: initialEventPlan.startDateTime,
                endDateTime: initialEventPlan.endDateTime,
            }}
            onSubmit={handleSubmit}
            imageHint="Current image remains unless you upload a new one."
        />
    )
}
