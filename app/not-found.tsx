import Link from 'next/link'

export default function NotFound() {
    return (
        <main
            className="min-h-dvh grid place-items-center bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900 text-white relative overflow-hidden p-6">
            {/* floating shapes and overlays */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl"/>
                <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl"/>
                <div className="absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl"/>
                {/* gradient overlay (was ::after) */}
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(1200px 400px at 50% 100%, rgba(255,255,255,0.08), transparent 60%),\n               radial-gradient(800px 300px at 0% 0%, rgba(255,255,255,0.06), transparent 50%),\n               radial-gradient(800px 300px at 100% 0%, rgba(255,255,255,0.06), transparent 50%)',
                    }}
                />
            </div>

            <section className="relative z-10 text-center max-w-xl">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
                    <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"/>
                    Lost in the party
                </p>
                <h1 className="text-7xl sm:text-8xl font-extrabold tracking-tight leading-none">
                    <span
                        className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-fuchsia-200 drop-shadow-[0_4px_14px_rgba(255,255,255,0.25)]">404</span>
                </h1>
                <p className="mt-4 text-lg text-white/90">This page didn’t make the guest list. Let’s take you back to
                    the map.</p>

                <div className="mt-8 flex items-center justify-center">
                    <Link
                        href="/"
                        className="relative inline-flex items-center gap-2 rounded-full bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold shadow-lg ring-1 ring-white/50 transition-colors duration-700 hover:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        {/* label */}
                        <span className="relative z-10">Back to Map</span>
                    </Link>
                </div>
            </section>

            {/* Removed shiny button animations and styles */}
        </main>
    )
}
