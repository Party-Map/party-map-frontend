"use client"

import {useEffect, useState} from "react"
import {geocodeAddress} from "@/lib/geocode"
import {GeocodeResult} from "@/lib/types";


export default function AddressSearchInput({value, onChange, onSelectResult}: {
    value: string
    onChange: (val: string) => void
    onSelectResult: (result: GeocodeResult) => void
}) {
    const [query, setQuery] = useState(value)
    const [results, setResults] = useState<GeocodeResult[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // sync when form sets it from outside
    useEffect(() => setQuery(value), [value])

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const handle = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await geocodeAddress(query)
                setResults(res)
                setOpen(true)
            } finally {
                setLoading(false)
            }
        }, 400)

        return () => clearTimeout(handle)
    }, [query])

    return (
        <div className="relative">
            <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Start typing the address..."
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    onChange(e.target.value)
                }}
                onFocus={() => results.length && setOpen(true)}
            />
            {loading && (
                <div className="absolute right-3 top-2.5 text-xs text-zinc-400">…</div>
            )}

            {open && results.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    {results.map((r, idx) => (
                        <li
                            key={idx}
                            className="cursor-pointer px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                onSelectResult(r)
                                setOpen(false)
                            }}
                        >
                            {(r.addressLine) ? r.addressLine : r.displayName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
