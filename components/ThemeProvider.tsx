'use client'
import React, {createContext, useContext, useEffect, useState} from 'react'

type Theme = 'light' | 'dark'
type ThemeContext = { theme: Theme; toggle: () => void }

const ThemeCtx = createContext<ThemeContext | null>(null)

export function ThemeProvider({children}: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark')

    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null
        // https://tailwindcss.com/docs/dark-mode#with-system-theme-support
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    }, [])

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

    return (
        <ThemeCtx.Provider value={{theme, toggle}}>
            {children}
        </ThemeCtx.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeCtx)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}
