"use client"

import {MapContainer, Marker, TileLayer, useMap, useMapEvents} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type {GeoPoint} from "@/lib/types"
import {useTheme} from "@/components/ThemeProvider";
import {defaultMapCenter} from "@/lib/constants";
import {toLatLngTuple} from "@/lib/utils";
import {useEffect} from "react";

function ClickHandler({onChange}: { onChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

function RecenterOnValue({value}: { value: GeoPoint | null }) {
    const map = useMap()

    useEffect(() => {
        if (!value) return
        map.setView([value.latitude, value.longitude], map.getZoom())
    }, [value, map])

    return null
}

// https://www.ippc.int/static/leaflet/images/
const markerIcon = L.icon({
    iconUrl: "https://www.ippc.int/static/leaflet/images/marker-icon.png",
    iconRetinaUrl: "https://www.ippc.int/static/leaflet/images/marker-icon%402x.png",
    shadowUrl: "https://www.ippc.int/static/leaflet/images/marker-shadow.png",
    iconSize: [25, 40],
    iconAnchor: [15, 40],
})

export default function LocationMapPicker({value, onChange}: {
    value: GeoPoint | null
    onChange: (val: GeoPoint) => void
}) {
    const center = value ? toLatLngTuple(value) : toLatLngTuple(defaultMapCenter)

    const {theme} = useTheme()
    // https://leaflet-extras.github.io/leaflet-providers/preview/
    const tileUrl =
        theme === 'dark'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <MapContainer
                center={center}
                zoom={13}
                style={{height: 260, width: "100%"}}
                scrollWheelZoom={false}
            >
                <TileLayer url={tileUrl}/>
                <ClickHandler
                    onChange={(lat, lng) => onChange({latitude: lat, longitude: lng})}
                />
                <RecenterOnValue value={value}/>
                <Marker
                    position={center}
                    icon={markerIcon}
                />
            </MapContainer>
        </div>
    )
}
