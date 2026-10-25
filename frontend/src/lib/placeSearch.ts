export interface PlaceResult {
  placeId: string | number;
  displayName: string;
  cityName: string;
  citySlug: string;
  lat: number;
  lng: number;
}

export interface NominatimRawItem {
  place_id: number | string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

const LEGACY_CITIES: Record<string, string> = {
  kochi: "kochi",
  bengaluru: "bengaluru",
  bangalore: "bengaluru",
  pune: "pune",
  hyderabad: "hyderabad",
  ahmedabad: "ahmedabad",
  delhi: "delhi",
  "new delhi": "delhi",
  mumbai: "mumbai",
  chennai: "chennai",
  madras: "chennai",
  thiruvananthapuram: "thiruvananthapuram",
};

export function formatPlaceResult(item: NominatimRawItem): PlaceResult {
  const addr = item.address || {};
  const primaryName = (item.name || item.display_name.split(",")[0] || "").trim();
  const districtOrCity = (
    addr.city || addr.town || addr.village || addr.municipality ||
    addr.suburb || addr.county || addr.state_district || ""
  ).trim();
  const state = (addr.state || "").trim();

  const parts: string[] = [];
  if (primaryName) parts.push(primaryName);
  if (districtOrCity && !parts.some((p) => p.toLowerCase() === districtOrCity.toLowerCase())) {
    parts.push(districtOrCity);
  }
  if (state && !parts.some((p) => p.toLowerCase() === state.toLowerCase())) {
    parts.push(state);
  }

  const cityName = parts.join(", ") || primaryName || "India";

  // Slug determination
  const normPrimary = primaryName.toLowerCase();
  let citySlug = "";
  if (LEGACY_CITIES[normPrimary]) {
    citySlug = LEGACY_CITIES[normPrimary];
  } else {
    citySlug = cityName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
    if (!citySlug) citySlug = "india-place";
  }

  return {
    placeId: item.place_id,
    displayName: item.display_name,
    cityName,
    citySlug,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };
}

let lastRequestTimestamp = 0;

export async function searchIndianPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  // Rate limit: at most 1 request per second
  const now = Date.now();
  const elapsed = now - lastRequestTimestamp;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  lastRequestTimestamp = Date.now();
  if (typeof window !== "undefined") {
    // Record request timestamp for verification
    const win = window as unknown as { __nominatimTimestamps?: number[] };
    win.__nominatimTimestamps = win.__nominatimTimestamps || [];
    win.__nominatimTimestamps.push(lastRequestTimestamp);
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    signal,
    headers: {
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    throw new Error("Search service failed");
  }

  const raw = await res.json();
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(formatPlaceResult);
}
