import { API_BASE_URL } from "@/lib/config";

export interface PlannerProject {
  id: number;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  city: string | null;
  location_lat: number | null;
  location_lng: number | null;
  budget?: string | number | null;
  start_date: string | null;
  end_date: string | null;
  stage: string;
  planner_id: number | null;
  planner_deadline: string | null;
  response_deadline: string | null;
  halt_reason: string | null;
  planner_deploy_permitted: boolean;
  proposal_rejection_reason: string | null;
  created_by?: number | null;
  official_name?: string | null;
  official_email?: string | null;
  official_organization?: string | null;
  official_designation?: string | null;
  site_area_lat?: number | null;
  site_area_lng?: number | null;
  site_area_radius_km?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvent {
  id: number;
  project_id: number;
  actor_id: number;
  from_stage: string;
  to_stage: string;
  note: string | null;
  created_at: string;
}

export interface SiteProposalPayload {
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
    throw new Error(msg);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export interface PlannerPendingInvite {
  project_id: number;
  title: string;
  city: string | null;
  official_name: string | null;
  planner_deadline: string | null;
  invited_at: string;
}

export function getPlannerProjects(): Promise<PlannerProject[]> {
  return request<PlannerProject[]>("/api/projects");
}

export function getPendingInvites(): Promise<PlannerPendingInvite[]> {
  return request<PlannerPendingInvite[]>("/api/planner/invites");
}

export function getPlannerProject(id: number): Promise<PlannerProject> {
  return request<PlannerProject>(`/api/projects/${id}`);
}

export function acceptInvite(projectId: number): Promise<PlannerProject> {
  return request<PlannerProject>(`/api/projects/${projectId}/invite/accept`, {
    method: "POST",
  });
}

export function declineInvite(projectId: number): Promise<PlannerProject> {
  return request<PlannerProject>(`/api/projects/${projectId}/invite/decline`, {
    method: "POST",
  });
}

export function proposeSite(
  projectId: number,
  payload: SiteProposalPayload
): Promise<PlannerProject> {
  return request<PlannerProject>(`/api/projects/${projectId}/propose-site`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function grantPlannerPermission(projectId: number): Promise<PlannerProject> {
  return request<PlannerProject>(`/api/projects/${projectId}/planner-permission`, {
    method: "POST",
  });
}

export function getProjectEvents(projectId: number): Promise<ProjectEvent[]> {
  return request<ProjectEvent[]>(`/api/projects/${projectId}/events`);
}
