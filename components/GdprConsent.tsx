"use client"
import { useEffect, useState } from 'react'

const KEY = 'pm:consent:v1'

export default function GdprConsent() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const stored = window.localStorage.getItem(KEY)
      if (!stored) setOpen(true)
    } catch {}
  }, [])

  const accept = () => {
    try { window.localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: 1 })) } catch {}
    setOpen(false)
  }
  const reject = () => {
    try { window.localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: 1, rejected: true })) } catch {}
    setOpen(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[5000] px-4 pb-5 pointer-events-none">
      <div className="max-w-xl mx-auto rounded-2xl border border-black/10 dark:border-white/10 shadow-lg bg-white/90
      dark:bg-zinc-900/80 backdrop-blur-xl p-4 pointer-events-auto animate-[fadeIn_.4s_ease]">
        <h2 className="text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Privacy & Cookies</h2>
        <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 mb-3">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam euismod, sapien quis facilisis dictum, augue
          sem pharetra purus, non vulputate lectus nulla at elit. Donec at lacus sed ipsum fermentum placerat. Nulla
          facilisi. Praesent vel ligula nec sapien posuere tristique. Sed sit amet ipsum vitae orci efficitur
          ullamcorper. Vivamus mattis mollis lorem, sed pulvinar risus blandit eget.
        </p>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={reject} className="px-3 py-1.5 text-xs font-medium rounded-full border border-zinc-300
          dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100
          dark:hover:bg-zinc-800 transition focus:outline-none focus-visible:ring-2
          focus-visible:ring-pink-500/50"
          >
            Reject
          </button>
          <button onClick={accept} className="px-4 py-1.5 text-xs font-semibold rounded-full bg-pink-600
          hover:bg-pink-500 active:bg-pink-700 text-white shadow focus:outline-none
          focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
