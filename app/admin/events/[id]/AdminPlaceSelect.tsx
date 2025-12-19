"use client"

import {useContext, useEffect, useState} from "react"
import type {PlaceAdminListItemData} from "@/lib/types"
import {SessionContext} from "@/app/SessionContextProvider"
import {fetchPlacesForAdminList} from "@/lib/api/event-plan"

export default function AdminPlaceSelect({
                                             value,
                                             onChange,
                                             placeholder = "Select place",
                                         }: {
    value?: PlaceAdminListItemData | null
    onChange?: (place: PlaceAdminListItemData | null) => void
    placeholder?: string
}) {
    const session = useContext(SessionContext)
    const [places, setPlaces] = useState<PlaceAdminListItemData[]>([])
    const [selectedId, setSelectedId] = useState<string>(value?.id ?? "")

    useEffect(() => {
        let mounted = true

        ;(async () => {
            try {
                const res = await fetchPlacesForAdminList(session)
                if (mounted) setPlaces(res ?? [])
            } catch {
                if (mounted) setPlaces([])
            }
        })()

        return () => {
            mounted = false
        }
    }, [session])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedId(value?.id ?? "")
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        setSelectedId(id)
        const found = places.find((p) => p.id === id) ?? null
        onChange?.(id ? found : null)
    }

    return (
        <div>
            <label>
                <span className="sr-only">{placeholder}</span>
                <select value={selectedId} onChange={handleChange}>
                    <option value="">{placeholder}</option>
                    {places.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} {p.city ? `— ${p.city}` : ""} {p.address ? `(${p.address})` : ""}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    )
}
