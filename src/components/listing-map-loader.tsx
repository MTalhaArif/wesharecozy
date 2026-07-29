"use client"; // next/dynamic with ssr:false is only allowed from a Client Component

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("@/components/listing-map").then((mod) => mod.ListingMap), {
  ssr: false,
});

export function ListingMapLoader({ lat, lng }: { lat: number; lng: number }) {
  return <ListingMap lat={lat} lng={lng} />;
}