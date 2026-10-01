import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import { Link } from "react-router";

import type { AdminDomain } from "@/pages/admin/domains";

import styles from "./DomainSwitcher.module.scss";
import menu from "./menu.module.scss";
import type { EntityItem } from "./useAdminEntities";

interface EntitySwitcherProps {
    domain: AdminDomain;
    items: EntityItem[] | undefined;
    /** The place or performer in view; "All …" when none is. */
    currentId: string | undefined;
    currentName: string | undefined;
}

/** Picks which place or performer the admin area is about, or all of them. */
export function EntitySwitcher({ domain, items, currentId, currentName }: EntitySwitcherProps) {
    const scope = domain.entity;
    if (!scope) return null;
    const label = currentId ? (currentName ?? scope.noun) : scope.allLabel;

    return (
        <Menu.Root>
            <Menu.Trigger
                className={styles.trigger}
                aria-label={`${scope.noun}: ${label}. Switch ${scope.noun.toLowerCase()}`}
            >
                <span className={styles.name}>{label}</span>
                <ChevronsUpDown size={14} className={styles.chevron} aria-hidden />
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Positioner className={menu.positioner} sideOffset={6} align="start">
                    <Menu.Popup className={menu.popup}>
                        <Menu.LinkItem
                            className={menu.item}
                            closeOnClick
                            aria-current={currentId ? undefined : "page"}
                            render={<Link to={domain.basePath} />}
                        >
                            <LayoutGrid size={16} className={menu.itemIcon} aria-hidden />
                            <span className={menu.itemText}>{scope.allLabel}</span>
                            {!currentId && <Check size={16} className={menu.check} aria-hidden />}
                        </Menu.LinkItem>
                        <Menu.Separator className={menu.separator} />
                        <Menu.Group>
                            <Menu.GroupLabel className={menu.label}>Yours</Menu.GroupLabel>
                            {items === undefined && <div className={menu.empty}>Loading…</div>}
                            {items?.length === 0 && <div className={menu.empty}>None yet</div>}
                            {items?.map((item) => (
                                <Menu.LinkItem
                                    key={item.id}
                                    className={menu.item}
                                    closeOnClick
                                    aria-current={item.id === currentId ? "page" : undefined}
                                    render={<Link to={`${domain.basePath}/${item.id}`} />}
                                >
                                    <span className={menu.itemText}>{item.name}</span>
                                    {item.id === currentId && <Check size={16} className={menu.check} aria-hidden />}
                                </Menu.LinkItem>
                            ))}
                        </Menu.Group>
                        <Menu.Separator className={menu.separator} />
                        <Menu.LinkItem
                            className={menu.item}
                            closeOnClick
                            render={<Link to={`${domain.basePath}/new`} />}
                        >
                            <Plus size={16} className={menu.itemIcon} aria-hidden />
                            {scope.newLabel}
                        </Menu.LinkItem>
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}
