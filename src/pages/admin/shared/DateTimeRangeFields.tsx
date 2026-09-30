import { Field, Input } from "@/components/Field";
import formStyles from "@/components/forms.module.scss";

interface DateTimeRangeFieldsProps {
    start: string;
    end: string;
    onChange: (start: string, end: string) => void;
    min?: string;
    max?: string;
    disabled?: boolean;
}

/** Two datetime-local inputs side by side (stacked on phones). Values are "YYYY-MM-DDTHH:mm". */
export function DateTimeRangeFields({ start, end, onChange, min, max, disabled }: DateTimeRangeFieldsProps) {
    return (
        <div className={formStyles.grid2}>
            <Field label="Start">
                {(id) => (
                    <Input
                        id={id}
                        type="datetime-local"
                        value={start}
                        min={min}
                        max={max}
                        disabled={disabled}
                        required
                        onChange={(e) => onChange(e.target.value, end)}
                    />
                )}
            </Field>
            <Field label="End">
                {(id) => (
                    <Input
                        id={id}
                        type="datetime-local"
                        value={end}
                        min={min}
                        max={max}
                        disabled={disabled}
                        required
                        onChange={(e) => onChange(start, e.target.value)}
                    />
                )}
            </Field>
        </div>
    );
}
