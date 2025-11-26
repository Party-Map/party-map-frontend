"use client"

import {useContext, useState} from "react"
import {useRouter} from "next/navigation"
import {GeoPoint, PlaceCreatePayload} from "@/lib/types"
import AddressSearchInput from "@/components/AddressSearchInput"
import ImageUpload from "@/components/ImageUpload"
import {SessionContext} from "@/lib/auth/session-provider";
import dynamic from "next/dynamic";
import {reverseGeocode} from "@/lib/geocode";
import {addPlace} from "@/lib/api/places";
// LeafLet uses window at import time, prevent SSR
const LocationMapPicker = dynamic(() => import('@/components/LocationMapPicker'), {ssr: false})


export default function NewPlacePage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [location, setLocation] = useState<GeoPoint | null>(null)
    const [description, setDescription] = useState("")
    const [tagsInput, setTagsInput] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const session = useContext(SessionContext)

    const handleMapLocationChange = (location: GeoPoint): void => {
        setLocation(location)

        reverseGeocode(location).then((data) => {
                if (!data) return

                if (data.addressLine) {
                    setAddress(data.addressLine)
                } else if (data.displayName) {
                    setAddress(data.displayName)
                }
                if (data.city) {
                    setCity(data.city)
                }
            }
        ).catch((err) => {
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
            image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=870&auto=format&fit=crop" // On prod use image store API
        }

        setSubmitting(true)
        try {
            const created = await addPlace(payload, session)
            router.push(`/admin/places/${created.id}`) // change this to admin view
        } catch (e: any) {
            console.error(e)
            setError("Could not create place. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold">Create a new place</h1>

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
                    {submitting ? "Saving…" : "Create place"}
                </button>
            </form>
        </main>
    )
}
