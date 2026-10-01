import { Chip } from "@/components/Chip";
import { BROWSE_RADIUS_OPTIONS_KM } from "@/lib/constants";

interface RadiusChipsProps {
    value: number | null;
    onChange: (radiusKm: number | null) => void;
}

/** "Any distance" or one of the radii around the origin. */
export function RadiusChips({ value, onChange }: RadiusChipsProps) {
    return (
        <>
            <Chip pressed={value === null} onClick={() => onChange(null)}>
                Any distance
            </Chip>
            {BROWSE_RADIUS_OPTIONS_KM.map((km) => (
                <Chip key={km} pressed={value === km} onClick={() => onChange(km)}>
                    {km} km
                </Chip>
            ))}
        </>
    );
}
