import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

import styles from "./ThemeToggle.module.css";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, toggle } = useTheme();
    const dark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={dark}
            aria-label="Toggle theme"
            title="Toggle theme"
            className={cn(styles.toggle, compact && styles.compact)}
        >
            {dark ? <Sun size={compact ? 22 : 18} aria-hidden /> : <Moon size={compact ? 22 : 18} aria-hidden />}
            {!compact && <span>{dark ? "Light" : "Dark"}</span>}
        </button>
    );
}
