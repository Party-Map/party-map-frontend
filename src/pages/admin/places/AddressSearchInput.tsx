import { useId, useState } from "react";

import { Input } from "@/components/Field";
import { GEOCODE_DEBOUNCE_MS } from "@/lib/constants";
import { geocodeAddress, type GeocodeResult } from "@/lib/geocode";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useResource } from "@/lib/hooks/useResource";

import styles from "./AddressSearchInput.module.scss";

interface AddressSearchInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onSelect: (result: GeocodeResult) => void;
}

/** Address text input that offers Nominatim matches while the user types. */
export function AddressSearchInput({ id, value, onChange, onSelect }: AddressSearchInputProps) {
    const listId = useId();
    const [open, setOpen] = useState(false);
    // Only text the user typed is searched; values set from outside (map click, a pick) are not.
    const [typed, setTyped] = useState<string | null>(null);
    const query = typed === value ? value : "";
    const debouncedQuery = useDebouncedValue(query, GEOCODE_DEBOUNCE_MS);
    const hasQuery = debouncedQuery.trim() !== "";
    const results = useResource(() => geocodeAddress(debouncedQuery), [debouncedQuery], { enabled: hasQuery });

    const items = hasQuery ? (results.data ?? []) : [];
    const showList = open && items.length > 0;

    const select = (result: GeocodeResult) => {
        setTyped(null);
        setOpen(false);
        onSelect(result);
    };

    return (
        <div className={styles.wrapper}>
            <Input
                id={id}
                value={value}
                onChange={(e) => {
                    setTyped(e.target.value);
                    setOpen(true);
                    onChange(e.target.value);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Start typing the address…"
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={listId}
            />
            {results.loading && (
                <span className={styles.loading} aria-hidden>
                    …
                </span>
            )}
            {showList && (
                <ul id={listId} role="listbox" className={styles.results}>
                    {items.map((result, index) => (
                        <li
                            key={index}
                            role="option"
                            aria-selected={false}
                            className={styles.result}
                            // mousedown (not click) so the input keeps focus and its blur does not close the list first
                            onMouseDown={(e) => {
                                e.preventDefault();
                                select(result);
                            }}
                        >
                            {result.addressLine || result.displayName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
