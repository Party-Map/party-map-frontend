'use client'
import {Moon, Sun} from 'lucide-react'
import {useTheme} from '@/app/ThemeContextProvider'

export default function ThemeToggle({mobile = false}: { mobile?: boolean }) {
    const {theme, toggle} = useTheme()
    const size = mobile ? 'h-6 w-6' : 'h-5 w-5'
    return (
        <button
            onClick={toggle}
            aria-pressed={theme === 'dark'}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 p-2 lg:px-3 backdrop-blur
                 shadow-sm hover:bg-white/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-800/70 transition cursor-pointer"
            title="Toggle theme"
        >
            {theme === 'dark' ? <Sun className={size}/> : <Moon className={size}/>}
            {!mobile && <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'}</span>}
        </button>
    )
}
