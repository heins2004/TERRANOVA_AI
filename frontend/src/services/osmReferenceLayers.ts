const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type OsmLayerType = "road" | "school" | "hospital";

export type OsmFeatureProperties = {
  id?: number | string;
  name?: string;
  highway?: string;
  amenity?: string;
  layer_type?: OsmLayerType;
  [key: string]: unknown;
};

export type OsmGeoJsonFeature = {
  type: "Feature";
  id?: string;
  geometry: {
    type: "LineString" | "Point" | "MultiLineString" | "Polygon";
    coordinates: number[] | number[][] | number[][][];
  };
  properties: OsmFeatureProperties;
};

export type OsmFeatureCollection = {
  type: "FeatureCollection";
  features: OsmGeoJsonFeature[];
};

export type OsmLayersResponse = {
  layers: Partial<Record<OsmLayerType, OsmFeatureCollection>>;
};

// Client-side in-memory session cache mapping `cellKey:layerType` -> OsmGeoJsonFeature[]
const clientCellCache = new Map<string, OsmGeoJsonFeature[]>();

const GRID_SIZE = 0.01;

function quantize(val: number): number {
  return Number((Math.floor(val / GRID_SIZE) * GRID_SIZE).toFixed(2));
}

export function computeGridCellKeys(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
): string[] {
  const startLat = quantize(minLat);
  const endLat = quantize(maxLat);
  const startLng = quantize(minLng);
  const endLng = quantize(maxLng);

  const latSteps = Math.round((endLat - startLat) / GRID_SIZE) + 1;
  const lngSteps = Math.round((endLng - startLng) / GRID_SIZE) + 1;

  if (latSteps * lngSteps > 25) {
    return [];
  }

  const cells: string[] = [];
  for (let i = 0; i < latSteps; i++) {
    const cMinLat = Number((startLat + i * GRID_SIZE).toFixed(2));
    const cMaxLat = Number((cMinLat + GRID_SIZE).toFixed(2));
    for (let j = 0; j < lngSteps; j++) {
      const cMinLng = Number((startLng + j * GRID_SIZE).toFixed(2));
      const cMaxLng = Number((cMinLng + GRID_SIZE).toFixed(2));
      cells.push(`${cMinLat.toFixed(2)},${cMinLng.toFixed(2)},${cMaxLat.toFixed(2)},${cMaxLng.toFixed(2)}`);
    }
  }
  return cells;
}

export async function fetchOsmLayers(params: {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  types: OsmLayerType[];
}): Promise<Record<OsmLayerType, OsmFeatureCollection>> {
  const { minLng, minLat, maxLng, maxLat, types } = params;
  if (!types.length) {
    return {
      road: { type: "FeatureCollection", features: [] },
      school: { type: "FeatureCollection", features: [] },
      hospital: { type: "FeatureCollection", features: [] },
    };
  }

  const cellKeys = computeGridCellKeys(minLat, minLng, maxLat, maxLng);

  // Check which types have missing cells in the client cache
  const typesToFetch: OsmLayerType[] = [];
  for (const type of types) {
    const hasAllCells = cellKeys.length > 0 && cellKeys.every((key) => clientCellCache.has(`${key}:${type}`));
    if (!hasAllCells) {
      typesToFetch.push(type);
    }
  }

  // If all cells for all requested types are already cached in this session, return immediately
  if (typesToFetch.length === 0 && cellKeys.length > 0) {
    const result: Record<OsmLayerType, OsmFeatureCollection> = {
      road: { type: "FeatureCollection", features: [] },
      school: { type: "FeatureCollection", features: [] },
      hospital: { type: "FeatureCollection", features: [] },
    };

    for (const type of types) {
      const seen = new Set<string>();
      const features: OsmGeoJsonFeature[] = [];
      for (const key of cellKeys) {
        const cellFeatures = clientCellCache.get(`${key}:${type}`) || [];
        for (const feat of cellFeatures) {
          const fid = feat.id || JSON.stringify(feat.geometry.coordinates);
          if (!seen.has(fid)) {
            seen.add(fid);
            features.push(feat);
          }
        }
      }
      result[type] = { type: "FeatureCollection", features };
    }
    return result;
  }

  // Otherwise, request from the backend proxy
  const query = new URLSearchParams({
    bbox: `${minLng.toFixed(4)},${minLat.toFixed(4)},${maxLng.toFixed(4)},${maxLat.toFixed(4)}`,
    types: types.join(","),
  });

  const response = await fetch(`${API_BASE_URL}/api/osm-layers?${query.toString()}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Failed to fetch reference layers.");
  }

  const data: OsmLayersResponse = await response.json();
  const returnedLayers = data.layers || {};

  const finalResult: Record<OsmLayerType, OsmFeatureCollection> = {
    road: returnedLayers.road || { type: "FeatureCollection", features: [] },
    school: returnedLayers.school || { type: "FeatureCollection", features: [] },
    hospital: returnedLayers.hospital || { type: "FeatureCollection", features: [] },
  };

  // Populate client cache for future pans within the same session
  if (cellKeys.length > 0) {
    for (const type of types) {
      const feats = finalResult[type]?.features || [];
      for (const key of cellKeys) {
        // Tag cell as cached
        if (!clientCellCache.has(`${key}:${type}`)) {
          clientCellCache.set(`${key}:${type}`, feats);
        }
      }
    }
  }

  return finalResult;
}
