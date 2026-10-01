import { Heart, LayoutList, LogIn, LogOut, Map as MapIcon, User } from "lucide-react";
import { NavLink } from "react-router";

import { useAuth } from "@/auth/provider";
import { cn } from "@/lib/utils";

import styles from "./NavActions.module.scss";

const ICON_SIZE = { desktop: 16, mobile: 20 };
const ITEM = { desktop: styles.desktop, mobile: styles.mobile };
const NAV = { desktop: styles.desktopNav, mobile: styles.mobileNav };

type Group = "explore" | "account";
const LABEL: Record<Group | "all", string> = { explore: "Explore", account: "Account", all: "Main" };

interface NavActionsProps {
    variant: "desktop" | "mobile";
    /** Only the Map/Browse links or only the account items; both (one nav) when omitted. */
    only?: Group;
}

/**
 * Map / Browse plus Profile / Likes / Sign in / Logout. The bottom bar shows them all in one nav; the desktop top
 * bar splits them, the explore links beside the brand and the account items on the right.
 */
export function NavActions({ variant, only }: NavActionsProps) {
    const { status, login, logout } = useAuth();
    const size = ICON_SIZE[variant];
    const itemClass = cn(styles.item, ITEM[variant]);
    const linkClass = ({ isActive }: { isActive: boolean }) => cn(itemClass, isActive && styles.active);

    const explore = only !== "account" && (
        <>
            <NavLink to="/" end className={linkClass}>
                <MapIcon size={size} aria-hidden />
                <span>Map</span>
            </NavLink>
            <NavLink to="/browse" className={linkClass}>
                <LayoutList size={size} aria-hidden />
                <span>Browse</span>
            </NavLink>
        </>
    );

    const account =
        only !== "explore" &&
        (status !== "authenticated" ? (
            <button type="button" className={itemClass} onClick={() => login()}>
                <LogIn size={size} aria-hidden />
                <span>Sign in</span>
            </button>
        ) : (
            <>
                <NavLink to="/profile" end className={linkClass}>
                    <User size={size} aria-hidden />
                    <span>Profile</span>
                </NavLink>
                <NavLink to="/profile/likes" className={linkClass}>
                    <Heart size={size} aria-hidden />
                    <span>Likes</span>
                </NavLink>
                <button type="button" className={itemClass} onClick={logout}>
                    <LogOut size={size} aria-hidden />
                    <span>Logout</span>
                </button>
            </>
        ));

    return (
        <nav className={cn(styles.nav, NAV[variant])} aria-label={LABEL[only ?? "all"]}>
            {explore}
            {account}
        </nav>
    );
}
