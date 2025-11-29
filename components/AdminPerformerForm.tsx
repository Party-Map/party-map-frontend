"use client"

import {useState} from "react"
import type {Link, PerformerCreatePayload, PerformerFormInitialValues,} from "@/lib/types"
import ImageUpload from "@/components/ImageUpload"
import {LinksInput} from "@/components/LinksInput";
import {useRouter} from "next/navigation";

export function AdminPerformerForm({
                                       title,
                                       submitLabel,
                                       initialValues,
                                       onSubmit,
                                       imageHint,
                                   }: {
    title: string
    submitLabel: string
    initialValues?: PerformerFormInitialValues
    onSubmit: (payload: PerformerCreatePayload) => Promise<void>
    imageHint?: string
}) {
    const router = useRouter()
    const [name, setName] = useState(initialValues?.name ?? "")
    const [genre, setGenre] = useState(initialValues?.genre ?? "")
    const [bio, setBio] = useState(initialValues?.bio ?? "")
    const [links, setLinks] = useState<Link[]>(initialValues?.links ?? [])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const payload: PerformerCreatePayload = {
            name,
            genre,
            bio,
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
        <div className="flex flex-col w-full">
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
                    <label className="mb-1 block text-sm font-medium">Genre</label>
                    <input
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        placeholder="techno, house, live act…"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Bio</label>
                    <textarea
                        className="min-h-[80px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
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
        </div>
    )
}
