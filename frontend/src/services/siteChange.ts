import { API_BASE_URL } from "@/lib/config";

export interface SiteChange {
  id: number;
  project_id: number;
  status: "requested" | "proposed" | "approved" | "rejected" | "cancelled" | "completed";
  reason: string;
  circle_lat?: number | null;
  circle_lng?: number | null;
  circle_radius_km?: number | null;
  proposed_site_name?: string | null;
  proposed_site_explanation?: string | null;
  proposed_site_lat?: number | null;
  proposed_site_lng?: number | null;
  rejection_reason?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface RequestSiteChangePayload {
  reason: string;
  circle_lat?: number | null;
  circle_lng?: number | null;
  circle_radius_km?: number | null;
}

export interface ProposeSiteChangePayload {
  name: string;
  explanation: string;
  location_lat: number;
  location_lng: number;
}

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
    let msg = body.detail ?? "Unable to complete request.";
    if (Array.isArray(body.detail)) {
      msg = body.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
    }
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }
  return response.json() as Promise<T>;
}

export async function getSiteChange(projectId: number): Promise<SiteChange | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/site-change`, {
    credentials: "include",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body.detail ?? "Unable to fetch site change.";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return response.json() as Promise<SiteChange>;
}

export async function requestSiteChange(
  projectId: number,
  payload: RequestSiteChangePayload
): Promise<SiteChange> {
  return request<SiteChange>(`/api/projects/${projectId}/site-change`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function proposeSiteChange(
  projectId: number,
  payload: ProposeSiteChangePayload
): Promise<SiteChange> {
  return request<SiteChange>(`/api/projects/${projectId}/site-change/propose`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function approveSiteChange(projectId: number): Promise<SiteChange> {
  return request<SiteChange>(`/api/projects/${projectId}/site-change/approve`, {
    method: "POST",
  });
}

export async function rejectSiteChange(projectId: number, reason: string): Promise<SiteChange> {
  return request<SiteChange>(`/api/projects/${projectId}/site-change/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function redeploySiteChange(projectId: number): Promise<SiteChange> {
  return request<SiteChange>(`/api/projects/${projectId}/site-change/redeploy`, {
    method: "POST",
  });
}

export async function cancelSiteChange(projectId: number): Promise<SiteChange> {
  return request<SiteChange>(`/api/projects/${projectId}/site-change/cancel`, {
    method: "POST",
  });
}
