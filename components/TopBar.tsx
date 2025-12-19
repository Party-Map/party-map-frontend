import ThemeToggle from "./ThemeToggle"
import SearchBar from "./SearchBar"
import NavActions from "./NavActions"
import Link from "next/link"
import {Baloo_2} from "next/font/google"
import {cn} from "@/lib/utils"

const partyFont = Baloo_2({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    variable: "--font-party",
})

const barBase = "h-16 rounded-2xl px-3 ring-1 ring-white/10 shadow-lg"
const barGradient = "bg-gradient-to-r from-violet-700 via-fuchsia-700 to-indigo-700 dark:from-violet-900 dark:via-fuchsia-900 dark:to-indigo-900"

export default function TopBar() {
    return (
        <div className="fixed inset-x-0 top-0 z-1500">
            <div className="mt-2 px-4">
                {/* Desktop */}
                <div
                    className={cn(
                        "hidden lg:flex items-center justify-between relative overflow-visible",
                        barBase,
                        barGradient
                    )}
                >
                    <Link
                        href="/"
                        className={cn(
                            "group relative flex items-center pl-1 pr-3 py-1 rounded-xl",
                            partyFont.className
                        )}
                    >
                        <span
                            className="text-2xl leading-none font-extrabold tracking-tight select-none text-white transition-colors duration-200 group-hover:text-indigo-100">
                          PartyMap
                        </span>
                    </Link>

                    <div className="flex-1 mx-4 max-w-3xl">
                        <div className="relative z-1300">
                            <SearchBar/>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <NavActions variant="desktop"/>
                        <ThemeToggle/>
                    </div>
                </div>

                {/* Mobile */}
                <div className={cn("lg:hidden flex items-center gap-3", barBase, barGradient)}>
                    <Link
                        href="/"
                        aria-label="PartyMap home"
                        className={cn(
                            "inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/15 ring-1 ring-white/30 text-[15px] font-bold tracking-tight text-white shadow-inner shadow-black/30 select-none transition-colors duration-200 hover:bg-white/20",
                            partyFont.className
                        )}
                    >
                        PM
                    </Link>

                    <div className="flex-1 relative z-1300">
                        <SearchBar/>
                    </div>
                </div>
            </div>
        </div>
    )
}
