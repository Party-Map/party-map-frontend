"use client"

import {useState} from "react"
import {EventPlanCreatePayload, EventPlanFormInitialValues, EventType, Link,} from "@/lib/types"
import ImageUpload from "@/app/admin/ImageUpload"
import {LinksInput} from "@/app/admin/LinksInput";
import {useRouter} from "next/navigation";
import DateTimeRangePicker from "@/components/DateTimeRangePicker";

export function AdminEventPlanForm({
                                       title,
                                       submitLabel,
                                       initialValues,
                                       onSubmit,
                                       imageHint,
                                   }: {
    title: string
    submitLabel: string
    initialValues?: EventPlanFormInitialValues
    onSubmit: (payload: EventPlanCreatePayload) => Promise<void>
    imageHint?: string
}) {
    const router = useRouter()
    const [eventTitle, setEventTitle] = useState(initialValues?.title ?? "")
    const [price, setPrice] = useState(initialValues?.price ?? "")
    const [kind, setKind] = useState(initialValues?.kind ?? "PUB")
    const [startDateTime, setStartDateTime] = useState(initialValues?.startDateTime ?? "")
    const [endDateTime, setEndDateTime] = useState(initialValues?.endDateTime ?? "")
    const [description, setDescription] = useState(initialValues?.description ?? "")
    const [links, setLinks] = useState<Link[]>(initialValues?.links ?? [])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const payload: EventPlanCreatePayload = {
            title: eventTitle,
            price: price,
            kind: kind,
            description: description,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            links: links.length ? links : undefined,
            image: initialValues?.image ?? null,
        }

        setSubmitting(true)
        try {
            await onSubmit(payload)
        } catch (e: any) {
            console.error(e)
            setError("Could not save performer. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }
    const handleCancel = () => {
        router.back()
    }

    return (
        <>
            <h1 className="mb-6 text-2xl font-bold">{title}</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Event Kind</label>

                    <select
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={kind}
                        onChange={(e) => setKind(e.target.value as EventType)}
                        required
                    >
                        <option value="" disabled>Select a kind…</option>

                        {(
                            ['DISCO', 'TECHNO', 'FESTIVAL', 'JAZZ', 'ALTER', 'HOME', 'PUB'] as EventType[]
                        ).map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
                <DateTimeRangePicker
                    start={startDateTime}
                    end={endDateTime}
                    onChange={(s, e) => {
                        setStartDateTime(s)
                        setEndDateTime(e)
                    }}
                />

                <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                        className="min-h-20 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Price</label>

                    <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                      HUF
                    </span>

                        <input
                            type="number"
                            className="w-full rounded-xl border border-zinc-300 bg-white pl-14 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                            placeholder="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            required
                        />
                    </div>
                </div>
                <LinksInput value={links} onChange={setLinks}/>
                <div>
                    <label className="mb-1 block text-sm font-medium">Profile image</label>
                    <ImageUpload value={imageFile} onChange={setImageFile}/>
                    {imageHint && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {imageHint}
                        </p>
                    )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer">
                        {submitting ? "Saving…" : submitLabel}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer">
                        Cancel
                    </button>
                </div>
            </form>
        </>
    )
}
