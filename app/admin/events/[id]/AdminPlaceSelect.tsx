"use client"

import {useContext, useEffect, useState} from "react"
import type {PlaceAdminListItemData} from "@/lib/types"
import {SessionContext} from "@/lib/auth/session-provider"
import {fetchPlacesForAdminList} from "@/lib/api/eventPlan"

type Props = {
    value?: PlaceAdminListItemData | null
    onChange?: (place: PlaceAdminListItemData | null) => void
    placeholder?: string
}

export default function AdminPlaceSelect({value, onChange, placeholder = "Select place"}: Props) {
    const session = useContext(SessionContext)
    const [places, setPlaces] = useState<PlaceAdminListItemData[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(value?.id ?? null)

    useEffect(() => {
        let mounted = true

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetchPlacesForAdminList(session)
                if (mounted) setPlaces(res)
            } catch (e) {
                if (mounted) setError("Failed to load places")
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => {
            mounted = false
        }
    }, [session])

    useEffect(() => {
        setSelectedId(value?.id ?? null)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value || null
        setSelectedId(id)
        const found = places?.find(p => p.id === id) ?? null
        onChange?.(found)
    }

    if (loading) return <div>Loading places…</div>
    if (error) return <div>{error}</div>

    return (
        <div>
            <label>
                <span className="sr-only">{placeholder}</span>
                <select value={selectedId ?? ""} onChange={handleChange}>
                    <option value="">{placeholder}</option>
                    {places?.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} {p.city ? `— ${p.city}` : ""} {p.address ? `(${p.address})` : ""}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    )
}

