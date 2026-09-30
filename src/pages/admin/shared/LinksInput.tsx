import { type Link, LINK_TYPES, type LinkType } from "@/api/types";
import { Button } from "@/components/Button";
import { formStyles, Select } from "@/components/Field";
import { LINK_TYPE_LABELS, LINK_TYPE_PREFIXES } from "@/lib/constants";

import styles from "./LinksInput.module.css";

export function toSuffix(type: LinkType, url: string): string {
    const prefix = LINK_TYPE_PREFIXES[type];
    return url.startsWith(prefix) ? url.slice(prefix.length) : url;
}

export function buildUrl(type: LinkType, suffix: string): string {
    const trimmed = suffix.trim();
    return trimmed ? LINK_TYPE_PREFIXES[type] + trimmed : "";
}

interface LinksInputProps {
    value: Link[];
    onChange: (links: Link[]) => void;
    label?: string;
}

/** Edit up to one link per network; the network prefix is fixed, the user types the rest. */
export function LinksInput({ value, onChange, label = "Links" }: LinksInputProps) {
    const usedTypes = new Set(value.map((l) => l.type));
    const nextUnused = LINK_TYPES.find((t) => !usedTypes.has(t));

    const add = () => {
        if (nextUnused) onChange([...value, { type: nextUnused, url: "" }]);
    };

    const changeType = (index: number, type: LinkType) => {
        const current = value[index];
        if (!current || value.some((l, i) => i !== index && l.type === type)) return;
        onChange(
            value.map((l, i) => (i === index ? { type, url: buildUrl(type, toSuffix(current.type, current.url)) } : l)),
        );
    };

    const changeSuffix = (index: number, suffix: string) => {
        onChange(value.map((l, i) => (i === index ? { ...l, url: buildUrl(l.type, suffix) } : l)));
    };

    const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

    return (
        <div className={formStyles.field}>
            <div className={formStyles.labelRow}>
                <span className={formStyles.label}>{label}</span>
                <Button variant="ghost" size="sm" onClick={add} disabled={!nextUnused}>
                    + Add link
                </Button>
            </div>

            {value.length === 0 && (
                <p className={formStyles.hint}>Add Instagram, Facebook, Twitter, Reddit or a website.</p>
            )}

            {value.map((link, index) => (
                <div key={link.type} className={styles.row}>
                    <Select
                        aria-label="Link type"
                        value={link.type}
                        onChange={(e) => changeType(index, e.target.value as LinkType)}
                        className={styles.typeSelect}
                    >
                        {LINK_TYPES.map((type) => (
                            <option key={type} value={type} disabled={usedTypes.has(type) && type !== link.type}>
                                {LINK_TYPE_LABELS[type]}
                            </option>
                        ))}
                    </Select>

                    <div className={formStyles.prefixed}>
                        <span className={formStyles.prefix}>{LINK_TYPE_PREFIXES[link.type]}</span>
                        <input
                            aria-label={`${LINK_TYPE_LABELS[link.type]} link`}
                            className={formStyles.control}
                            value={toSuffix(link.type, link.url)}
                            onChange={(e) => changeSuffix(index, e.target.value)}
                            placeholder="username-or-path"
                        />
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => remove(index)}
                        aria-label={`Remove ${LINK_TYPE_LABELS[link.type]} link`}
                    >
                        Remove
                    </Button>
                </div>
            ))}
        </div>
    );
}
