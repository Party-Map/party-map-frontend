'use client';

import {cn} from "@/lib/utils";
import Link from "next/link";
import {usePathname} from "next/navigation";

export function SignInButton({design = ''}) {
    const pathName = usePathname()
    return (
        <Link href={`/auth/login?callback=${encodeURIComponent(pathName)}`}>
            <button
                className={cn("px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer text-white", design)}
            >
                Sign in
            </button>
        </Link>
    );
}

export function SignOutButton() {
    const pathName = usePathname()
    return (
        <Link href={`/auth/logout?callback=${encodeURIComponent(pathName)}`}>
            <button
                className="px-3 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition cursor-pointer"
            >
                Logout
            </button>
        </Link>
    );
}

