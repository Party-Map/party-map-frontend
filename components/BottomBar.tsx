import ThemeToggle from './ThemeToggle'
import NavActions from './NavActions'

export default function BottomBar() {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-[1200] md:hidden pointer-events-none safe-bottom">
            <div className="relative mx-auto max-w-screen-sm px-4 pb-[env(safe-area-inset-bottom)]">
                <div className="flex h-16 items-center justify-between rounded-2xl
                        bg-zinc-900/90 text-zinc-100 backdrop-blur ring-1 ring-white/10 shadow-lg
                        pointer-events-auto">
                    <div className="flex-1 px-2">
                        <NavActions variant="mobile"/>
                    </div>
                    <div className="px-3">
                        <ThemeToggle small/>
                    </div>
                </div>
            </div>
        </nav>
    )
}
