"use client";
import L from "leaflet";
import { Marker, Popup, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { City } from "@/services/cities";
const markerIcon = L.divIcon({ className: "terranova-map-marker", html: '<span class="terranova-map-marker__dot" style="--marker-color:#22d3ee"></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
export function CityPickerMap({ cities, onSelect, highlightedSlug }: { cities: City[]; onSelect: (slug: string) => void; highlightedSlug?: string }) { return <MapContainer center={[20.5937, 78.9629]} className="h-full w-full" scrollWheelZoom zoom={5}><TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />{cities.map((city) => <Marker icon={markerIcon} key={city.slug} opacity={highlightedSlug && city.slug !== highlightedSlug ? 0.35 : 1} position={[city.lat, city.lng]} eventHandlers={{ click: () => onSelect(city.slug) }}><Popup><button className="font-data-mono text-[12px] text-primary" onClick={() => onSelect(city.slug)} type="button">BROWSE {city.name.toUpperCase()} →</button></Popup></Marker>)}</MapContainer>; }
