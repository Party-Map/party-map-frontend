import { useEffect, useMemo } from "react";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "@/lib/constants";
import type { GeoPoint } from "@/lib/types";
import styles from "./LocationMapPicker.module.css";

type LocationMapPickerProps = {
    value: GeoPoint | null;
    onChange: (location: GeoPoint) => void;
};

function ClickHandler({ onPick }: { onPick: (location: GeoPoint) => void }) {
    useMapEvents({
        click: (event) => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
    });
    return null;
}

/** Keeps the map centred on the value, also when it is set from outside (address search). */
function RecenterOnValue({ value }: { value: GeoPoint | null }) {
    const map = useMap();
    const latitude = value?.latitude;
    const longitude = value?.longitude;

    useEffect(() => {
        if (latitude === undefined || longitude === undefined) return;
        map.setView([latitude, longitude], map.getZoom());
    }, [map, latitude, longitude]);

    return null;
}

/** Small map with one draggable-by-click marker for choosing a place's coordinates. */
export function LocationMapPicker({ value, onChange }: LocationMapPickerProps) {
    const point = value ?? DEFAULT_MAP_CENTER;
    const center: [number, number] = [point.latitude, point.longitude];
    // Leaflet's own marker images, bundled by Vite instead of resolved from its CSS.
    const markerPin = useMemo(
        () =>
            L.icon({
                iconUrl: markerIcon,
                iconRetinaUrl: markerIcon2x,
                shadowUrl: markerShadow,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                shadowSize: [41, 41],
            }),
        [],
    );

    return (
        <div className={styles.frame}>
            <MapContainer center={center} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom={false} className={styles.map}>
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                <ClickHandler onPick={onChange} />
                <RecenterOnValue value={value} />
                <Marker position={center} icon={markerPin} />
            </MapContainer>
        </div>
    );
}
