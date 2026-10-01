import { Search } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Input, Select } from "@/components/Field";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import styles from "./FilterBar.module.scss";

interface SortControl {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

interface FilterBarProps {
    /** The search as the URL has it; the box starts from it and reports debounced changes. */
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    sort?: SortControl;
    /** The chip rows. */
    children?: ReactNode;
}

/** The search box, the sort select and the chip rows above a browse list. */
export function FilterBar({ search, onSearchChange, placeholder, sort, children }: FilterBarProps) {
    const [value, setValue] = useState(search);
    const debounced = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);
    const lastSent = useRef(search);

    useEffect(() => {
        if (debounced === lastSent.current) return;
        lastSent.current = debounced;
        onSearchChange(debounced);
    }, [debounced, onSearchChange]);

    return (
        <div className={styles.bar}>
            <div className={styles.controls}>
                <div className={styles.search}>
                    <Search size={16} aria-hidden className={styles.icon} />
                    <Input
                        type="search"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className={styles.input}
                    />
                </div>
                {sort && (
                    <Select
                        aria-label="Sort"
                        value={sort.value}
                        onChange={(event) => sort.onChange(event.target.value)}
                        className={styles.sort}
                    >
                        {sort.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                )}
            </div>
            {children}
        </div>
    );
}
