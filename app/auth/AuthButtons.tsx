'use client';

import {cn} from "@/lib/utils";
import Link from "next/link";
import {usePathname} from "next/navigation";

type AuthButtonProps = {
    design?: string;
    children?: React.ReactNode;
};

export function SignInButton({design = "", children}: AuthButtonProps) {
    const pathName = usePathname();

    return (
        <Link
            href={`/auth/login?callback=${encodeURIComponent(pathName)}`}
            className={cn("cursor-pointer", design)}
        >
            {children ?? "Sign in"}
        </Link>
    );
}

export function SignOutButton({design = "", children}: AuthButtonProps) {
    const pathName = usePathname();

    return (
        <Link
            href={`/auth/logout?callback=${encodeURIComponent(pathName)}`}
            className={cn("cursor-pointer", design)}
        >
            {children ?? "Logout"}
        </Link>
    );
}

