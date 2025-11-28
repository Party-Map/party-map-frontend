"use client"

import {useContext} from "react"
import {useRouter} from "next/navigation"
import type {Performer, PerformerCreatePayload} from "@/lib/types"
import {SessionContext} from "@/lib/auth/session-provider"
import {updatePerformer} from "@/lib/api/performers"
import {AdminPerformerForm} from "@/components/AdminPerformerForm"

export default function PerformerEditForm({
                                              initialPerformer,
                                          }: {
    initialPerformer: Performer
}) {
    const router = useRouter()
    const session = useContext(SessionContext)

    const handleSubmit = async (payload: PerformerCreatePayload) => {
        const updated = await updatePerformer(
            initialPerformer.id,
            {
                ...payload,
                image: payload.image ?? initialPerformer.image ?? null,
            },
            session,
        )

        router.push(`/performers/${updated.id}`)
    }

    return (
        <AdminPerformerForm
            title="Edit performer"
            submitLabel="Save changes"
            initialValues={{
                name: initialPerformer.name,
                genre: initialPerformer.genre,
                bio: initialPerformer.bio ?? "",
                image: initialPerformer.image ?? null,
                links: initialPerformer.links ?? [],
            }}
            onSubmit={handleSubmit}
            imageHint="Current image remains unless you upload a new one."
        />
    )
}
