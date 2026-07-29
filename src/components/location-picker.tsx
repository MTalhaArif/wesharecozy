"use client"; // Leaflet reads window/document at import time; only ever mounted via a dynamic(..., { ssr: false }) import

import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Istanbul city center — used only as the map's initial view.
const ISTANBUL_CENTER: [number, number] = [41.0082, 28.9784];

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChange(lat, lng);
  };

  return (
    <MapContainer center={ISTANBUL_CENTER} zoom={11} className="h-72 w-full rounded-md">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={handleSelect} />
      {position && <Marker position={position} icon={markerIcon} />}
    </MapContainer>
  );
}