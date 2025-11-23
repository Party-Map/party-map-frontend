import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'
import NavActions from './NavActions'
import Link from 'next/link'
import {Baloo_2} from 'next/font/google'

const partyFont = Baloo_2({subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-party'})

export default function TopBar() {
    return (
        <div className="fixed inset-x-0 top-0 z-[1500] pointer-events-none">
            <div className="mt-2 px-4">
                <div className="hidden lg:flex h-16 items-center justify-between rounded-2xl
                        bg-gradient-to-r from-violet-700 via-fuchsia-700 to-indigo-700
                        dark:from-violet-900 dark:via-fuchsia-900 dark:to-indigo-900
                        px-3 ring-1 ring-white/10 shadow-lg pointer-events-auto relative overflow-visible">
                    <Link href="/"
                          className={`party-logo group relative flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl ${partyFont.className}`}>
                        <span className="party-logo-text font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r
                        from-amber-200 via-white to-fuchsia-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]
                        text-2xl leading-none select-none [letter-spacing:-0.02em]"
                        >
                          Party <span
                            className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-violet-200 to-indigo-200">Map</span>
                        </span>
                    </Link>

                    <div className="flex-1 mx-4 max-w-3xl">
                        <div className="relative z-[1300]">
                            <SearchBar/>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <NavActions variant="desktop"/>
                        <ThemeToggle/>
                    </div>
                </div>

                {/* Mobile bar */}
                <div className="lg:hidden h-16 rounded-2xl
                        bg-gradient-to-r from-violet-700 via-fuchsia-700 to-indigo-700
                        dark:from-violet-900 dark:via-fuchsia-900 dark:to-indigo-900
                        ring-1 ring-white/10 px-3 flex items-center shadow-lg pointer-events-auto gap-3">
                    <Link href="/"
                          className={`inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/15 ring-1 ring-white/30 text-[15px] font-bold tracking-tight text-white shadow-inner shadow-black/30 select-none ${partyFont.className}`}>
                        PM
                    </Link>
                    <div className="flex-1 relative z-[1300]">
                        <SearchBar/>
                    </div>
                </div>
            </div>
        </div>
    )
}
