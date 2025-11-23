"use client"
import {useEffect} from 'react'
import toast from 'react-hot-toast'
import {cn} from "@/lib/utils";

const KEY = 'pm:consent:v1'

export default function GdprConsent() {
    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const stored = window.localStorage.getItem(KEY)
            if (stored) return

            toast.custom(t => (
                <div
                    className={cn("pointer-events-auto fixed inset-x-0 bottom-0 z-[5000] px-4 pb-5 transition-all duration-300",
                        {
                            'opacity-100 translate-y-0': t.visible,
                            'opacity-0 translate-y-2': !t.visible
                        }
                    )}
                >
                    <div className="max-w-xl mx-auto rounded-2xl border border-black/10 dark:border-white/10 shadow-lg bg-white/90
                    dark:bg-zinc-900/80 backdrop-blur-xl p-4">
                        <h2 className="text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
                            Privacy & Cookies
                        </h2>
                        <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 mb-3">
                            This site uses cookies and local storage to remember your settings, improve
                            functionality, and keep the map working smoothly. We do not track you across
                            other websites or use your data for advertising. You can accept or reject
                            these optional features using the buttons below.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-end">
                            <button
                                onClick={() => {
                                    try {
                                        window.localStorage.setItem(
                                            KEY,
                                            JSON.stringify({t: Date.now(), v: 1, rejected: true}),
                                        )
                                    } catch {
                                    }
                                    toast.dismiss(t.id)
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-full border border-zinc-300
                                          dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100
                                          dark:hover:bg-zinc-800 transition focus:outline-none focus-visible:ring-2
                                          focus-visible:ring-pink-500/50 cursor-pointer"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => {
                                    try {
                                        window.localStorage.setItem(
                                            KEY,
                                            JSON.stringify({t: Date.now(), v: 1}),
                                        )
                                    } catch {
                                    }
                                    toast.dismiss(t.id)
                                }}
                                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-pink-600
                                          hover:bg-pink-500 active:bg-pink-700 text-white shadow focus:outline-none
                                          focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            ), {
                duration: Infinity,         // stays until user clicks
                position: 'bottom-center', // GDPR banner at bottom
            })
        } catch {
        }
    }, [])

    // This component only triggers the toast
    return null
}
