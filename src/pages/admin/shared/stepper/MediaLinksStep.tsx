import { Controller, useFormContext } from "react-hook-form";

import type { Link } from "@/api/types";
import { ImageUrlField } from "@/pages/admin/shared/ImageUrlField";
import { LinksInput } from "@/pages/admin/shared/LinksInput";

/** The forms' shared last step: the image address and the social links (fields `image` and `links`). */
export function MediaLinksStep({ imageLabel }: { imageLabel?: string }) {
    const { control } = useFormContext<{ image: string; links: Link[] }>();
    return (
        <>
            <Controller
                control={control}
                name="image"
                render={({ field, fieldState }) => (
                    <ImageUrlField
                        {...(imageLabel ? { label: imageLabel } : {})}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                    />
                )}
            />
            <Controller
                control={control}
                name="links"
                render={({ field }) => <LinksInput value={field.value} onChange={field.onChange} />}
            />
        </>
    );
}
