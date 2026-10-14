import { API_BASE_URL } from "@/lib/config";

export interface GovProject {
  id: number;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  city: string | null;
  location_lat: number | null;
  location_lng: number | null;
  budget: string | number | null;
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  stage: string;
  planner_id: number | null;
  planner_name?: string | null;
  planner_deadline: string | null;
  response_deadline: string | null;
  halt_reason: string | null;
  planner_deploy_permitted: boolean;
  proposal_rejection_reason: string | null;
  proposed_site_name?: string | null;
  proposed_site_explanation?: string | null;
  proposed_site_lat?: number | null;
  proposed_site_lng?: number | null;
  site_area_lat?: number | null;
  site_area_lng?: number | null;
  site_area_radius_km?: number | null;
}

export interface GovProjectEvent {
  id: number;
  project_id: number;
  actor_id: number;
  from_stage: string | null;
  to_stage: string;
  note: string | null;
  created_at: string;
}

export interface PlannerSearchItem {
  id: number;
  name: string;
  city: string | null;
}

export interface GovProjectCreatePayload {
  title: string;
  description?: string;
  category?: string;
  city: string;
  location_lat?: number;
  location_lng?: number;
  budget?: number;
  start_date?: string;
  end_date?: string;
  site_area_lat?: number | null;
  site_area_lng?: number | null;
  site_area_radius_km?: number | null;
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
    throw new Error(msg);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function getGovProjects(): Promise<GovProject[]> {
  return request<GovProject[]>("/api/projects");
}

export function getGovProject(id: number): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}`);
}

export function createGovProject(payload: GovProjectCreatePayload): Promise<GovProject> {
  return request<GovProject>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateGovProject(id: number, payload: Partial<GovProjectCreatePayload>): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function searchPlanners(query: string): Promise<PlannerSearchItem[]> {
  return request<PlannerSearchItem[]>(`/api/projects/planners?q=${encodeURIComponent(query)}`);
}

export function invitePlanner(id: number, payload: { planner_id: number; planner_deadline?: string }): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/invite`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelInvite(id: number): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/invite/cancel`, {
    method: "POST",
  });
}

export function reassignPlanner(id: number, payload: { planner_id: number; planner_deadline?: string }): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/reassign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveProposal(id: number): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/approve-proposal`, {
    method: "POST",
  });
}

export function rejectProposal(id: number, reason: string): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/reject-proposal`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function deployProject(id: number, response_deadline: string): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/deploy`, {
    method: "POST",
    body: JSON.stringify({ response_deadline }),
  });
}

export function extendDeadline(id: number, response_deadline: string): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/extend-deadline`, {
    method: "POST",
    body: JSON.stringify({ response_deadline }),
  });
}

export function haltProject(id: number, reason: string): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/halt`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function recallProject(id: number, reason: string): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/recall`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function startInProgress(id: number): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/in-progress`, {
    method: "POST",
  });
}

export function completeProject(id: number): Promise<GovProject> {
  return request<GovProject>(`/api/projects/${id}/complete`, {
    method: "POST",
  });
}

export function getProjectEvents(id: number): Promise<GovProjectEvent[]> {
  return request<GovProjectEvent[]>(`/api/projects/${id}/events`);
}
