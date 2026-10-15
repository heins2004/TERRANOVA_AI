export interface SupportedCity {
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export const SUPPORTED_CITIES: SupportedCity[] = [
  { slug: "delhi", name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { slug: "mumbai", name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { slug: "pune", name: "Pune", lat: 18.5204, lng: 73.8567 },
  { slug: "hyderabad", name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { slug: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { slug: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { slug: "kochi", name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { slug: "thiruvananthapuram", name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
];

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  SUPPORTED_CITIES.map((c) => [c.slug, { lat: c.lat, lng: c.lng }])
);

export function getCityCoordinates(slug?: string | null): { lat: number; lng: number } {
  if (slug && CITY_COORDINATES[slug]) {
    return CITY_COORDINATES[slug];
  }
  return { lat: 28.6139, lng: 77.2090 }; // Default New Delhi
}
