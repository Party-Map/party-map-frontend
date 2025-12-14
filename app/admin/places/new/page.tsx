"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {PlaceCreatePayload} from "@/lib/types"
import {SessionContext} from "@/lib/auth/SessionContextProvider"
import {addPlace} from "@/lib/api/places"
import {AdminPlaceForm} from "@/app/admin/places/AdminPlaceForm"

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=870&auto=format&fit=crop"

export default function NewPlacePage() {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: PlaceCreatePayload) => {
        const created = await addPlace(
            {
                ...payload,
                image: payload.image ?? FALLBACK_IMAGE, // No real image DB for now
            },
            session,
        )
        router.push(`/places/${created.id}`)
    }

    return (
        <AdminPlaceForm
            title="Create a new place"
            submitLabel="Create place"
            onSubmit={handleSubmit}
        />
    )
}
