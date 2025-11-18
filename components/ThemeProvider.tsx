'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeContext = { theme: Theme; toggle: () => void }

const ThemeCtx = createContext<ThemeContext | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark')

    // Load initial theme
    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null
        setTheme(saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    }, [])

    // Apply + persist theme
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

    return (
        <ThemeCtx.Provider value={{ theme, toggle }}>
            {children}
        </ThemeCtx.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeCtx)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}
