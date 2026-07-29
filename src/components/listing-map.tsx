"use client"; // Leaflet reads window/document at import time; only ever mounted via a dynamic(..., { ssr: false }) import

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { markerIcon } from "@/lib/leaflet-icon";
import "leaflet/dist/leaflet.css";

// Read-only pin for a listing's jittered (never exact) coordinates.
export function ListingMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={markerIcon} />
    </MapContainer>
  );
}