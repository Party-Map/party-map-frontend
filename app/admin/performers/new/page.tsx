"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {PerformerCreatePayload} from "@/lib/types"
import {SessionContext} from "@/app/SessionContextProvider"
import {AdminPerformerForm} from "@/app/admin/performers/AdminPerformerForm";
import {addPerformer} from "@/lib/api/performers";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1512830414785-9928e23475dc?q=80&w=1170&auto=format&fit=crop"

export default function NewPerformerPage() {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: PerformerCreatePayload) => {
        const created = await addPerformer(
            {
                ...payload,
                image: payload.image ?? FALLBACK_IMAGE, // No real image DB for now
            },
            session,
        )
        router.push(`/performers/${created.id}`)
    }

    return (
        <AdminPerformerForm
            title="Create new Performer"
            submitLabel="Create performer"
            onSubmit={handleSubmit}
        />
    )
}