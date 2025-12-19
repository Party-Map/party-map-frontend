import ThemeToggle from "../../components/ThemeToggle"
import NavActions from "../../components/NavActions"
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

export default function AdminTopBar() {
    return (
        <div className="w-full px-4 py-3">
            <div className={cn("flex items-center justify-between", barBase, barGradient)}>
                <Link
                    href="/admin"
                    className={cn("group relative flex items-center pl-1 pr-3 py-1 rounded-xl", partyFont.className)}
                >
          <span
              className="text-2xl leading-none font-extrabold tracking-tight select-none text-white transition-colors duration-200 group-hover:text-indigo-100">
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
