"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {Place, PlaceCreatePayload} from "@/lib/types"
import {SessionContext} from "@/app/SessionContextProvider"
import {updatePlace} from "@/lib/api/places"
import {AdminPlaceForm} from "@/app/admin/places/AdminPlaceForm"

export default function AdminPlaceEditForm({initialPlace}: { initialPlace: Place }) {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: PlaceCreatePayload) => {
        const updated = await updatePlace(
            initialPlace.id,
            {
                ...payload,
                image: payload.image ?? initialPlace.image ?? null,
            },
            session,
        )

        router.push(`/places/${updated.id}`)
    }

    return (
        <AdminPlaceForm
            title="Edit place"
            submitLabel="Save changes"
            initialValues={{
                name: initialPlace.name,
                address: initialPlace.address,
                city: initialPlace.city,
                location: initialPlace.location,
                description: initialPlace.description ?? "",
                tags: initialPlace.tags,
                image: initialPlace.image ?? null,
            }}
            onSubmit={handleSubmit}
            imageHint="Current image remains unless you upload a new one."
        />
    )
}
