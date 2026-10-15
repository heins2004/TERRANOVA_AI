import L from "leaflet";

export function computeDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const centerMarkerIcon = L.divIcon({
  className: "site-area-center-marker",
  html: `<div style="width:18px;height:18px;background:#22d3ee;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 10px #22d3ee;transform:translate(-50%,-50%);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export const pinMarkerIcon = L.divIcon({
  className: "site-area-pin-marker",
  html: `<div style="width:24px;height:24px;background:#34d399;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 14px #34d399;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);"><div style="width:8px;height:8px;background:#ffffff;border-radius:50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const ESRI_DARK_TILES = {
  base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  reference: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
};

export const ESRI_SATELLITE_TILES = {
  base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  reference: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
};
