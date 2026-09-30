import { CoverImage } from "@/components/CoverImage";
import { Field, Input } from "@/components/Field";

import styles from "./ImageUrlField.module.scss";

interface ImageUrlFieldProps {
    label?: string;
    value: string;
    onChange: (url: string) => void;
}

/**
 * Cover image as a URL with a live preview. The backend stores an image URL and has no upload
 * endpoint yet; when one exists this field is the place to add uploading.
 */
export function ImageUrlField({ label = "Cover image URL", value, onChange }: ImageUrlFieldProps) {
    return (
        <Field label={label} hint="Paste a link to a JPG, PNG or WEBP image.">
            {(id) => (
                <>
                    <Input
                        id={id}
                        type="url"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="https://…"
                    />
                    {value.trim() && (
                        <div className={styles.preview}>
                            <CoverImage src={value} alt="Cover preview" height="md" />
                        </div>
                    )}
                </>
            )}
        </Field>
    );
}
