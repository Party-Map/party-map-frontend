"use client"

import React from "react"
import moment from "moment"

function toLocalInputValue(iso?: string) {
    if (!iso) return ""
    const m = moment(iso)
    if (!m.isValid()) return ""
    // format YYYY-MM-DDTHH:mm
    return m.format("YYYY-MM-DDTHH:mm")
}

export default function DateTimeRangePicker({start, end, onChange}: {
    start?: string
    end?: string
    onChange: (startIso: string, endIso: string) => void
}) {
    const startValue = toLocalInputValue(start)
    const endValue = toLocalInputValue(end)

    const handleStart = (v: string) => {
        const iso = v ? moment(v).toISOString() : ""
        onChange(iso, end ?? "")
    }
    const handleEnd = (v: string) => {
        const iso = v ? moment(v).toISOString() : ""
        onChange(start ?? "", iso)
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
