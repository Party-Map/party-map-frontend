"use client";

import React, {useContext} from 'react'
import Link from 'next/link'
import {LogIn, LogOut, User} from 'lucide-react'
import {SessionContext} from "@/lib/auth/session-provider";
import {SignInButton, SignOutButton} from "@/components/AuthButtons";
import {MdFavoriteBorder} from "react-icons/md";

export default function NavActions({variant = 'desktop'}: { variant?: 'desktop' | 'mobile' }) {

    const session = useContext(SessionContext)

    if (variant === "mobile") {
        if (session?.accessToken) {
            return (
                <div className="flex w-full justify-between px-12 py-2">
                    <Link
                        href="/profile"
                        className="flex flex-col items-center justify-center gap-1 text-xs text-white/90 hover:text-white transition"
                    >
                        <User className="h-5 w-5"/>
                        <span>Profile</span>
                    </Link>

                    <Link
                        href="/profile/likes"
                        className="flex flex-col items-center justify-center gap-1 text-xs text-white/90 hover:text-white transition"
                    >
                        <MdFavoriteBorder className="h-5 w-5"/>
                        <span>Likes</span>
                    </Link>

                    <SignOutButton
                        design="flex flex-col items-center justify-center gap-1 text-xs text-white/90 hover:text-white transition"
                    >
                        <LogOut className="h-5 w-5"/>
                        <span>Logout</span>
                    </SignOutButton>
                </div>
            );
        }

        return (
            <div className="flex w-full justify-end px-4 py-2">
                <SignInButton
                    design="flex flex-col items-center justify-center gap-1 text-xs text-white/90 hover:text-white transition"
                >
                    <LogIn className="h-5 w-5"/>
                    <span>Sign in</span>
                </SignInButton>
            </div>
        );
    }

    return (
        <nav className="flex items-center gap-1">
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

                    <Link
                        href="/profile/likes"
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm
                     text-white/95 hover:text-white hover:bg-white/10 transition group"
                    >
                        <MdFavoriteBorder className="h-4 w-4 group-hover:text-red-500"/>
                        <span>Likes</span>
                    </Link>

                    <SignOutButton
                        design="inline-flex gap-2 items-center rounded-full px-3 py-2 text-white/95 hover:text-white hover:bg-white/10 transition text-sm cursor-pointer"
                    >
                        <LogOut className="h-4 w-4"/>
                        <span>Logout</span>
                    </SignOutButton>
                </>
            ) : (
                <SignInButton
                    design="inline-flex gap-2 items-center rounded-full px-3 py-2 text-white/95 hover:text-white hover:bg-white/10 transition text-sm cursor-pointer"
                >
                    <LogIn className="h-4 w-4"/>
                    <span>Sign in</span>
                </SignInButton>
            )}
        </nav>
    );

}
