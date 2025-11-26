import ThemeToggle from "./ThemeToggle"
import NavActions from "./NavActions"
import Link from "next/link"
import {Baloo_2} from "next/font/google"

const partyFont = Baloo_2({subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-party"})

export default function AdminTopBar() {
    return (
        <div className="w-full px-4 py-3">
            <div
                className="h-16 flex items-center justify-between rounded-2xl
                bg-gradient-to-r from-violet-700 via-fuchsia-700 to-indigo-700
                dark:from-violet-900 dark:via-fuchsia-900 dark:to-indigo-900
                px-3 ring-1 ring-white/10 shadow-lg"
            >
                <Link
                    href="/admin"
                    className={`party-logo flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl ${partyFont.className}`}
                >
                    <span
                        className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r
                        from-amber-200 via-white to-fuchsia-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]
                        text-2xl leading-none select-none [letter-spacing:-0.02em]"
                    >
                            Admin Panel
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    <NavActions variant="desktop"/>
                    <ThemeToggle/>
                </div>
            </div>
        </div>
    )
}
