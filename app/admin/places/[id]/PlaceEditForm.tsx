"use client"

import {useContext, useState} from "react"
import {useRouter} from "next/navigation"
import type {GeoPoint, Place, PlaceCreatePayload} from "@/lib/types"
import {SessionContext} from "@/lib/auth/session-provider"
import AddressSearchInput from "@/components/AddressSearchInput"
import ImageUpload from "@/components/ImageUpload"
import dynamic from "next/dynamic"
import {reverseGeocode} from "@/lib/geocode"
import {updatePlace} from "@/lib/api/places"

const LocationMapPicker = dynamic(
    () => import("@/components/LocationMapPicker"),
    {ssr: false},
)

export default function PlaceEditForm({initialPlace}: { initialPlace: Place }) {
    const router = useRouter()
    const session = useContext(SessionContext)

    const [name, setName] = useState(initialPlace.name)
    const [address, setAddress] = useState(initialPlace.address)
    const [city, setCity] = useState(initialPlace.city)
    const [location, setLocation] = useState<GeoPoint | null>(initialPlace.location)
    const [description, setDescription] = useState(initialPlace.description ?? "")
    const [tagsInput, setTagsInput] = useState(initialPlace.tags.join(", "))
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleMapLocationChange = (loc: GeoPoint): void => {
        setLocation(loc)

        reverseGeocode(loc)
            .then((data) => {
                if (!data) return

                if (data.addressLine) {
                    setAddress(data.addressLine)
                } else if (data.displayName) {
                    setAddress(data.displayName)
                }
                if (data.city) {
                    setCity(data.city)
                }
            })
            .catch((err) => {
                console.error("Geocode error:", err)
            })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!location) {
            setError("Please pick a location on the map.")
            return
        }

        const tags = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)

        const payload: PlaceCreatePayload = {
            name,
            address,
            city,
            location,
            description,
            tags,
            image: initialPlace.image ?? null,
        }

        setSubmitting(true)
        try {
            const updated = await updatePlace(initialPlace.id, payload, session)
            router.push(`/places/${updated.id}`)
        } catch (e: any) {
            console.error(e)
            setError("Could not save place. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold">Edit place</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Address
                    </label>
                    <AddressSearchInput
                        value={address}
                        onChange={setAddress}
                        onSelectResult={(r) => {
                            setAddress(r.addressLine || r.displayName)
                            if (r.city) setCity(r.city)
                            setLocation(r.location)
                        }}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        City
                    </label>
                    <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                    />
                </div>

                <div className="relative z-10 overflow-hidden">
                    <div className="mb-1 flex items-center justify-between">
                        <label className="text-sm font-medium">
                            Location on map
                        </label>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Click on the map to adjust the marker
            </span>
                    </div>
                    <LocationMapPicker
                        value={location}
                        onChange={handleMapLocationChange}
                    />
                    {location && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Lat: {location.latitude.toFixed(5)} · Lng:{" "}
                            {location.longitude.toFixed(5)}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Description
                    </label>
                    <textarea
                        className="min-h-[80px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Tags
                    </label>
                    <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        placeholder="bar, terrace, techno, cheap drinks…"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Separate tags with commas.
                    </p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Cover image
                    </label>
                    <ImageUpload value={imageFile} onChange={setImageFile}/>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Current image remains unless you upload a new one.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    {submitting ? "Saving…" : "Save changes"}
                </button>
            </form>
        </main>
    )
}
