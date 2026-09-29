const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type GeoJSONPoint = {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
};

export type StudyArea = {
  id: number;
  name: string;
  city: string | null;
  boundary: GeoJSONPolygon;
  created_by: number;
  created_at: string;
};

export type StudyAreaPayload = {
  name: string;
  city?: string | null;
  boundary: GeoJSONPolygon;
};

export type CandidateSite = {
  id: number;
  study_area_id: number;
  name: string;
  location: GeoJSONPoint;
  area_size_acres: number | null;
  land_use: string | null;
  suitability_status: string;
  availability_status: string;
  ownership_type: string;
  flood_risk: string;
  notes: string | null;
  promoted_project_id: number | null;
  created_by: number;
  created_at: string;
};

export type ProximityItem = {
  id: number;
  candidate_site_id: number;
  amenity_type: "hospital" | "school" | "road";
  name: string | null;
  distance_meters: number;
  computed_at: string;
};

export type CandidateSiteDetail = CandidateSite & {
  proximity: ProximityItem[];
};

export type CandidateSitePayload = {
  name: string;
  location: GeoJSONPoint;
  area_size_acres?: number | null;
  land_use?: string | null;
  suitability_status?: string;
  availability_status?: string;
  ownership_type?: string;
  flood_risk?: string;
  notes?: string | null;
};

export type StatusUpdatePayload = {
  suitability_status?: string;
  availability_status?: string;
  ownership_type?: string;
  flood_risk?: string;
};

export type PromotePayload = {
  title?: string;
  city?: string;
  category?: string;
  description?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to complete request.");
  }

  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

export function getStudyAreas(): Promise<StudyArea[]> {
  return request<StudyArea[]>("/api/study-areas");
}

export function getStudyArea(id: number): Promise<StudyArea> {
  return request<StudyArea>(`/api/study-areas/${id}`);
}

export function createStudyArea(payload: StudyAreaPayload): Promise<StudyArea> {
  return request<StudyArea>("/api/study-areas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCandidateSites(studyAreaId: number): Promise<CandidateSite[]> {
  return request<CandidateSite[]>(`/api/study-areas/${studyAreaId}/candidate-sites`);
}

export function createCandidateSite(
  studyAreaId: number,
  payload: CandidateSitePayload,
): Promise<CandidateSite> {
  return request<CandidateSite>(`/api/study-areas/${studyAreaId}/candidate-sites`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCandidateSite(
  id: number,
  payload: Partial<CandidateSitePayload>,
): Promise<CandidateSite> {
  return request<CandidateSite>(`/api/candidate-sites/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Phase 2 additions

export function getCandidateSiteDetail(id: number): Promise<CandidateSiteDetail> {
  return request<CandidateSiteDetail>(`/api/candidate-sites/${id}`);
}

export function updateCandidateSiteStatus(
  id: number,
  payload: StatusUpdatePayload,
): Promise<CandidateSiteDetail> {
  return request<CandidateSiteDetail>(`/api/candidate-sites/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function refreshCandidateSiteProximity(id: number): Promise<ProximityItem[]> {
  return request<ProximityItem[]>(`/api/candidate-sites/${id}/proximity/refresh`, {
    method: "POST",
  });
}

export function promoteCandidateSite(
  id: number,
  payload: PromotePayload = {},
): Promise<{ project_id: number }> {
  return request<{ project_id: number }>(`/api/candidate-sites/${id}/promote`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
