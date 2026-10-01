import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown } from "lucide-react";
import { Link } from "react-router";

import type { AdminDomain } from "@/pages/admin/domains";

import styles from "./DomainSwitcher.module.scss";
import menu from "./menu.module.scss";

interface DomainSwitcherProps {
    domains: AdminDomain[];
    current: AdminDomain | undefined;
    /** On phones show only the icon, leaving room for the entity switcher. */
    compact?: boolean;
}

/**
 * The admin domain in view; with more than one domain (several roles) it opens a menu to switch between them, like
 * the account switcher of a cloud dashboard.
 */
export function DomainSwitcher({ domains, current, compact = false }: DomainSwitcherProps) {
    const shown = current ?? domains[0];
    if (!shown) return null;
    const Icon = shown.icon;
    const label = (
        <>
            <span className={styles.icon} aria-hidden>
                <Icon size={16} />
            </span>
            <span className={styles.name} data-compact={compact || undefined}>
                {shown.label}
            </span>
        </>
    );

    if (domains.length < 2) return <span className={styles.trigger}>{label}</span>;

    return (
        <Menu.Root>
            <Menu.Trigger className={styles.trigger} aria-label={`Admin domain: ${shown.label}. Switch domain`}>
                {label}
                <ChevronsUpDown size={14} className={styles.chevron} data-compact={compact || undefined} aria-hidden />
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Positioner className={menu.positioner} sideOffset={6} align="start">
                    <Menu.Popup className={menu.popup}>
                        <Menu.Group>
                            <Menu.GroupLabel className={menu.label}>Switch domain</Menu.GroupLabel>
                            {domains.map((domain) => {
                                const DomainIcon = domain.icon;
                                const selected = domain.id === shown.id;
                                return (
                                    <Menu.LinkItem
                                        key={domain.id}
                                        className={menu.item}
                                        closeOnClick
                                        aria-current={selected ? "page" : undefined}
                                        render={<Link to={domain.basePath} />}
                                    >
                                        <DomainIcon size={16} className={menu.itemIcon} aria-hidden />
                                        <span className={menu.itemText}>
                                            {domain.label}
                                            <span className={menu.itemHint}>{domain.description}</span>
                                        </span>
                                        {selected && <Check size={16} className={menu.check} aria-hidden />}
                                    </Menu.LinkItem>
                                );
                            })}
                        </Menu.Group>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}
