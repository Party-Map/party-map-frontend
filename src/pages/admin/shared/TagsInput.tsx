import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

import { TAG_MAX, TAGS_MAX } from "./formSchemas";
import styles from "./TagsInput.module.scss";

interface TagsInputProps {
    id?: string;
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    invalid?: boolean;
}

/** Adds each text as a tag (trimmed, cut to 40 characters), skipping blanks, duplicates in any case and overflow. */
export function withTags(tags: string[], texts: string[]): string[] {
    let next = tags;
    for (const text of texts) {
        const tag = text.trim().slice(0, TAG_MAX);
        const known = next.some((existing) => existing.toLowerCase() === tag.toLowerCase());
        if (tag && !known && next.length < TAGS_MAX) next = [...next, tag];
    }
    return next;
}

/** Tags as removable chips: Enter or a comma adds what was typed, Backspace in the empty box removes the last. */
export function TagsInput({ id, value, onChange, placeholder, invalid = false }: TagsInputProps) {
    const [draft, setDraft] = useState("");
    const full = value.length >= TAGS_MAX;

    const add = (texts: string[]) => {
        const next = withTags(value, texts);
        if (next !== value) onChange(next);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add([draft]);
            setDraft("");
        } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className={styles.box} data-invalid={invalid || undefined}>
            <ul className={styles.chips} aria-label="Selected tags">
                {value.map((tag) => (
                    <li key={tag} className={styles.chip}>
                        {tag}
                        <button
                            type="button"
                            className={styles.remove}
                            onClick={() => onChange(value.filter((other) => other !== tag))}
                            aria-label={`Remove tag ${tag}`}
                        >
                            <X size={12} aria-hidden />
                        </button>
                    </li>
                ))}
            </ul>
            <input
                id={id}
                className={styles.input}
                value={draft}
                onChange={(event) => {
                    const text = event.target.value;
                    // A pasted "a, b, c" becomes tags; the text after the last comma stays in the box.
                    const parts = text.split(",");
                    const rest = parts.pop() ?? "";
                    if (parts.length > 0) add(parts);
                    setDraft(rest);
                }}
                onKeyDown={onKeyDown}
                onBlur={() => {
                    add([draft]);
                    setDraft("");
                }}
                placeholder={full ? `Up to ${TAGS_MAX} tags` : placeholder}
                disabled={full}
                aria-invalid={invalid || undefined}
                maxLength={TAG_MAX}
                autoComplete="off"
            />
        </div>
    );
}
