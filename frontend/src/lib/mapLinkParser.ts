/**
 * Pure parser for map links and coordinate strings.
 * Operates client-side only; never makes network requests or logs input.
 */

export interface ParseSuccess {
  success: true;
  lat: number;
  lng: number;
  source: string;
}

export interface ParseError {
  success: false;
  error: string;
  code:
    | "EMPTY"
    | "TOO_LONG"
    | "SHORT_LINK"
    | "INVALID_SCHEME"
    | "UNSUPPORTED_HOST"
    | "SWAPPED_COORDINATES"
    | "OUT_OF_BOUNDS"
    | "UNRECOGNISED";
}

export type ParseResult = ParseSuccess | ParseError;

const SHORT_LINK_HOST_REGEX =
  /^(?:.*\.)?(?:maps\.app\.goo\.gl|goo\.gl|g\.co|share\.google)$/i;

const KNOWN_MAP_HOST_REGEX =
  /^(?:.*\.)?(?:google\.[a-z.]+|googleusercontent\.com|openstreetmap\.org|apple\.com|bing\.com)$/i;

const COORD_PAIR_REGEX =
  /^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/;

function validateBounds(
  lat: number,
  lng: number,
  source: string
): ParseResult {
  if (isNaN(lat) || isNaN(lng)) {
    return {
      success: false,
      error: "Coordinates must be valid decimal numbers.",
      code: "UNRECOGNISED",
    };
  }

  // Check if coordinates appear to be swapped (longitude in 68-98 and latitude in 6-38)
  if (lat >= 68 && lat <= 98 && lng >= 6 && lng <= 38) {
    return {
      success: false,
      error:
        "Coordinates appear to be swapped (longitude first). Please enter latitude (6-38) then longitude (68-98).",
      code: "SWAPPED_COORDINATES",
    };
  }

  // Check bounds inside India: lat 6 to 38, lng 68 to 98
  if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
    return {
      success: false,
      error: "Coordinates must be within India (latitude 6-38, longitude 68-98).",
      code: "OUT_OF_BOUNDS",
    };
  }

  return {
    success: true,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    source,
  };
}

function parseUrlCoordinates(
  urlObj: URL
): { lat: number; lng: number; source: string } | null {
  const host = urlObj.hostname.toLowerCase();
  const searchParams = urlObj.searchParams;
  const hash = urlObj.hash;
  const pathname = urlObj.pathname;

  // 1. Check query parameters: ?q=lat,lng, ?ll=lat,lng, ?query=lat,lng, ?coordinate=lat,lng
  const paramKeys = ["q", "ll", "query", "coordinate"];
  for (const key of paramKeys) {
    const val = searchParams.get(key);
    if (val) {
      const match = val.trim().match(/^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2]),
          source: `${host} query param ${key}`,
        };
      }
    }
  }

  // 2. OpenStreetMap query params: ?mlat=...&mlon=...
  const mlat = searchParams.get("mlat");
  const mlon = searchParams.get("mlon");
  if (mlat && mlon) {
    const lat = parseFloat(mlat);
    const lng = parseFloat(mlon);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        source: "openstreetmap query params",
      };
    }
  }

  // 3. OpenStreetMap hash: #map=zoom/lat/lon
  if (hash) {
    const osmHashMapMatch = hash.match(/#map=\d+\/([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)/);
    if (osmHashMapMatch) {
      return {
        lat: parseFloat(osmHashMapMatch[1]),
        lng: parseFloat(osmHashMapMatch[2]),
        source: "openstreetmap hash",
      };
    }
  }

  // 4. Google Maps path with @lat,lng
  const atMatch = pathname.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
      source: "google maps path @coords",
    };
  }

  // 5. Google Maps /place/.../data=...!3dLAT!4dLNG
  const fullPathAndQuery = pathname + urlObj.search;
  const data3dMatch = fullPathAndQuery.match(/!3d([+-]?\d+(?:\.\d+)?)/);
  const data4dMatch = fullPathAndQuery.match(/!4d([+-]?\d+(?:\.\d+)?)/);
  if (data3dMatch && data4dMatch) {
    return {
      lat: parseFloat(data3dMatch[1]),
      lng: parseFloat(data4dMatch[1]),
      source: "google maps data !3d!4d",
    };
  }

  return null;
}

/**
 * Main parse function for map links or coordinate text.
 */
export function parseMapLinkOrCoords(input: string): ParseResult {
  const trimmed = (input || "").trim();

  if (!trimmed) {
    return {
      success: false,
      error: "Please enter a map link or coordinates.",
      code: "EMPTY",
    };
  }

  if (trimmed.length > 2000) {
    return {
      success: false,
      error: "Input must not exceed 2000 characters.",
      code: "TOO_LONG",
    };
  }

  // Check if input has a URI scheme or starts with www.
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  const isWww = /^www\./i.test(trimmed);

  if (schemeMatch || isWww) {
    if (schemeMatch) {
      const scheme = schemeMatch[1].toLowerCase();
      if (scheme !== "http" && scheme !== "https") {
        return {
          success: false,
          error: "Only http and https links are supported.",
          code: "INVALID_SCHEME",
        };
      }
    }

    let parsedUrl: URL;
    try {
      const urlToParse = isWww ? `https://${trimmed}` : trimmed;
      parsedUrl = new URL(urlToParse);
    } catch {
      return {
        success: false,
        error:
          "Unrecognised format. Please paste a valid map link or coordinates (latitude, longitude).",
        code: "UNRECOGNISED",
      };
    }

    const host = parsedUrl.hostname.toLowerCase();

    // Check for known short link domains
    if (
      SHORT_LINK_HOST_REGEX.test(host) ||
      host.includes("goo.gl") ||
      host.includes("g.co") ||
      host.includes("share.google")
    ) {
      return {
        success: false,
        error:
          "Short links cannot be read. Open the link in your browser and paste the full address from the address bar, or use Pick on map.",
        code: "SHORT_LINK",
      };
    }

    // Check for recognized map hosts
    if (!KNOWN_MAP_HOST_REGEX.test(host)) {
      return {
        success: false,
        error:
          "Unrecognised map service. Please paste a link from Google Maps, OpenStreetMap, Apple Maps, or enter coordinates directly.",
        code: "UNSUPPORTED_HOST",
      };
    }

    const coords = parseUrlCoordinates(parsedUrl);
    if (!coords) {
      return {
        success: false,
        error:
          "Could not find coordinates in the pasted map link. Please open the pin and copy its full address, or enter coordinates directly.",
        code: "UNRECOGNISED",
      };
    }

    return validateBounds(coords.lat, coords.lng, coords.source);
  }

  // Otherwise, attempt parsing as plain "lat, lng" or "lat lng" text
  const match = trimmed.match(COORD_PAIR_REGEX);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return validateBounds(lat, lng, "plain text coordinates");
  }

  return {
    success: false,
    error:
      "Unrecognised format. Please paste a valid map link or coordinates (latitude, longitude).",
    code: "UNRECOGNISED",
  };
}
