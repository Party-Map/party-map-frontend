"use client";

import React, {useContext} from 'react'
import Link from 'next/link'
import {Ticket, User} from 'lucide-react'
import {SessionContext} from "@/lib/auth/session-provider";
import {SignInButton, SignOutButton} from "@/components/AuthButtons";

export default function NavActions({variant = 'desktop'}: { variant?: 'desktop' | 'mobile' }) {

    const session = useContext(SessionContext)

    if (variant === 'mobile') {
        return (
            <div className="grid w-full grid-cols-3">
                <Link
                    href="/404"
                    className="flex flex-col items-center justify-center gap-1 text-xs opacity-95"
                >
                    <Ticket className="h-5 w-5"/>
                    <span>Tickets</span>
                </Link>
                {session?.accessToken ? (
                    <>
                        <Link
                            href="/profile"
                            className="flex flex-col items-center justify-center gap-1 text-xs opacity-95"
                        >
                            <User className="h-5 w-5"/>
                            <span>Profile</span>
                        </Link>
                        <SignOutButton/>
                    </>
                ) : (
                    <SignInButton/>
                )}
            </div>
        )
    }

    // desktop
    return (
        <nav className="flex items-center gap-1">
            <Link
                href="/404"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm
                     text-white/95 hover:text-white hover:bg-white/10 transition"
            >
                <Ticket className="h-4 w-4"/>
                <span>Tickets</span>
            </Link>
            {session?.accessToken ? (
                <>
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm
                     text-white/95 hover:text-white hover:bg-white/10 transition"
                    >
                        <User className="h-4 w-4"/>
                        <span>Profile</span>
                    </Link>
                    <SignOutButton/>
                </>
            ) : (
                <SignInButton/>
            )}
        </nav>
    )
}
