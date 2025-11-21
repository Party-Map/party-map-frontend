"use client"
import {useEffect, useState} from 'react'

export default function Toast() {
    const [msg, setMsg] = useState<string | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onToast = (e: Event) => {
            const ce = e as CustomEvent<{ message: string }>
            if (!ce?.detail?.message) return
            setMsg(ce.detail.message)
            setVisible(true)
            clearTimeout((window as any).__pm_toast_timer)
            ;(window as any).__pm_toast_timer = setTimeout(() => setVisible(false), 2600)
        }
        window.addEventListener('pm:toast', onToast as any)
        return () => window.removeEventListener('pm:toast', onToast as any)
    }, [])

    return (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[1600] flex justify-center">
            <div
                className={`transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            >
                {msg && (
                    <div
                        className="mx-2 inline-flex items-center gap-2 rounded-full bg-zinc-900/90 text-white px-4 py-2 text-sm ring-1 ring-white/10 shadow-lg">
                        {msg}
                    </div>
                )}
            </div>
        </div>
    )
}
