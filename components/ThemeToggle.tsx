'use client'
import {Moon, Sun} from 'lucide-react'
import {useTheme} from './ThemeProvider'

export default function ThemeToggle({small = false}: { small?: boolean }) {
    const {theme, toggle} = useTheme()
    const size = small ? 'h-4 w-4' : 'h-5 w-5'
    return (
        <button
            onClick={toggle}
            aria-pressed={theme === 'dark'}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 p-2 backdrop-blur
                 shadow-sm hover:bg-white/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-800/70 transition cursor-pointer"
            title="Toggle theme"
        >
            {theme === 'dark' ? <Sun className={size}/> : <Moon className={size}/>}
            {!small && <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'}</span>}
        </button>
    )
}
