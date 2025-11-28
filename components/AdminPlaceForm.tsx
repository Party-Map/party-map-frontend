"use client"

import {useState} from "react"
import type {GeoPoint, Link, PlaceCreatePayload, PlaceFormInitialValues} from "@/lib/types"
import AddressSearchInput from "@/components/AddressSearchInput"
import ImageUpload from "@/components/ImageUpload"
import dynamic from "next/dynamic"
import {reverseGeocode} from "@/lib/geocode"
import {LinksInput} from "@/components/LinksInput";
import {useRouter} from "next/navigation";

const LocationMapPicker = dynamic(
    () => import("@/components/LocationMapPicker"),
    {ssr: false},
)

export function AdminPlaceForm({
                                   title,
                                   submitLabel,
                                   initialValues,
                                   onSubmit,
                                   imageHint,
                               }: {
    title: string
    submitLabel: string
    initialValues?: PlaceFormInitialValues
    onSubmit: (payload: PlaceCreatePayload) => Promise<void>
    imageHint?: string
}) {
    const router = useRouter()
    const [name, setName] = useState(initialValues?.name ?? "")
    const [address, setAddress] = useState(initialValues?.address ?? "")
    const [city, setCity] = useState(initialValues?.city ?? "")
    const [location, setLocation] = useState<GeoPoint | null>(
        initialValues?.location ?? null,
    )
    const [description, setDescription] = useState(
        initialValues?.description ?? "",
    )
    const [tagsInput, setTagsInput] = useState(
        (initialValues?.tags ?? []).join(", "),
    )
    const [links, setLinks] = useState<Link[]>(initialValues?.links ?? [])
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
            links: links.length ? links : undefined,
            image: initialValues?.image ?? null,
        }

        setSubmitting(true)
        try {
            await onSubmit(payload)
        } catch (e: any) {
            console.error(e)
            setError("Could not save place. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }
    const handleCancel = () => {
        router.back()
    }

    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold">{title}</h1>

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
                <LinksInput value={links} onChange={setLinks}/>
                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Cover image
                    </label>
                    <ImageUpload value={imageFile} onChange={setImageFile}/>
                    {imageHint && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {imageHint}
                        </p>
                    )}
                </div>

                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                    >
                        {submitting ? "Saving…" : submitLabel}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </main>
    )
}
