import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Turbopack's static asset imports don't always match the StaticImageData
// { src, width, height } shape TypeScript expects from next/image-types/global
// -- at runtime it can just be a plain string path. Resolve either shape.
function resolveSrc(image: string | { src: string }): string {
  return typeof image === "string" ? image : image.src;
}

export const markerIcon = L.icon({
  iconRetinaUrl: resolveSrc(iconRetinaUrl),
  iconUrl: resolveSrc(iconUrl),
  shadowUrl: resolveSrc(shadowUrl),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});