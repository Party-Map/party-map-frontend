"use client"

import {useCallback, useRef, useState} from "react"

type Props = {
    value?: File | null
    onChange: (file: File | null) => void
}

export default function ImageUpload({value, onChange}: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return
            const file = files[0]

            setError(null)
            onChange(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        },
        [onChange],
    )

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        handleFiles(e.dataTransfer.files)
    }

    const handleBrowseClick = () => {
        inputRef.current?.click()
    }

    return (
        <div>
            <div
                onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600 transition hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:bg-zinc-800"
            >
                <p className="font-medium">
                    {value ? "Change image" : "Drop a cover image here"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    or click to browse. JPG / PNG / WEBP, up to 5 MB.
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {previewUrl && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-40 w-full object-cover"
                    />
                </div>
            )}

            {error && (
                <p className="mt-2 text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    )
}
