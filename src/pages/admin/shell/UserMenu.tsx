import { Menu } from "@base-ui/react/menu";
import { ExternalLink, Heart, LogOut, User } from "lucide-react";
import { Link, useLocation } from "react-router";

import { useAuth } from "@/auth/provider";

import menu from "./menu.module.scss";
import styles from "./UserMenu.module.scss";

/** Up to two initials from the user's name, for the avatar. */
export function initials(name: string): string {
    const letters = name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? "");
    return (letters.length > 1 ? `${letters[0]}${letters.at(-1)}` : (letters[0] ?? "?")).slice(0, 2);
}

/** The signed-in user's avatar with their pages, the Keycloak account console and log out. */
export function UserMenu() {
    const { user, logout, accountUrl } = useAuth();
    const { pathname } = useLocation();
    const name = user?.name ?? "Account";

    return (
        <Menu.Root>
            <Menu.Trigger className={styles.trigger} aria-label={`Account menu for ${name}`}>
                <span className={styles.avatar} aria-hidden>
                    {initials(name)}
                </span>
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Positioner className={menu.positioner} sideOffset={6} align="end">
                    <Menu.Popup className={menu.popup}>
                        <div className={styles.who}>
                            <span className={styles.name}>{name}</span>
                            {user?.email && <span className={styles.email}>{user.email}</span>}
                        </div>
                        <Menu.Separator className={menu.separator} />
                        <Menu.LinkItem className={menu.item} closeOnClick render={<Link to="/profile" />}>
                            <User size={16} className={menu.itemIcon} aria-hidden />
                            Profile
                        </Menu.LinkItem>
                        <Menu.LinkItem className={menu.item} closeOnClick render={<Link to="/profile/likes" />}>
                            <Heart size={16} className={menu.itemIcon} aria-hidden />
                            Likes
                        </Menu.LinkItem>
                        <Menu.LinkItem className={menu.item} closeOnClick href={accountUrl(pathname)}>
                            <ExternalLink size={16} className={menu.itemIcon} aria-hidden />
                            Account settings
                        </Menu.LinkItem>
                        <Menu.Separator className={menu.separator} />
                        <Menu.Item className={menu.item} onClick={() => logout()}>
                            <LogOut size={16} className={menu.itemIcon} aria-hidden />
                            Log out
                        </Menu.Item>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}
