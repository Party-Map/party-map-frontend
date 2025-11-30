"use client"

import React from "react"

export default function DateTimeRangePicker({
                                                start,
                                                end,
                                                onChange,
                                            }: {
    start?: string
    end?: string
    onChange: (start: string, end: string) => void
}) {
    const startValue = start ?? ""
    const endValue = end ?? ""

    const handleStart = (v: string) => {
        onChange(v || "", end ?? "")
    }

    const handleEnd = (v: string) => {
        onChange(start ?? "", v || "")
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
                <label className="mb-1 block text-sm font-medium">Start</label>
                <input
                    type="datetime-local"
                    value={startValue}
                    onChange={(e) => handleStart(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">End</label>
                <input
                    type="datetime-local"
                    value={endValue}
                    onChange={(e) => handleEnd(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                />
            </div>
        </div>
    )
}
