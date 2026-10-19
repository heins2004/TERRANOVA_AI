import { API_BASE_URL } from "@/lib/config";

export interface ProjectConsultation {
  id: number;
  project_id: number;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  type: "Online" | "Venue";
  meeting_url: string | null;
  venue_address: string | null;
  city: string;
  max_attendees: number | null;
  visibility: "Public" | "Private";
  status: "Scheduled" | "Cancelled";
  cancel_reason: string | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  invited_emails?: string[];
  invite_count?: number;
}

export interface PublicProjectConsultation {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  type: "Online" | "Venue";
  meeting_url: string | null;
  venue_address: string | null;
  max_attendees: number | null;
  status: "Scheduled" | "Cancelled";
  cancel_reason: string | null;
}

export interface ProjectConsultationCreatePayload {
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  type: "Online" | "Venue";
  meeting_url?: string | null;
  venue_address?: string | null;
  max_attendees?: number | null;
  visibility: "Public" | "Private";
  invite_emails?: string[];
}

export interface ProjectConsultationUpdatePayload {
  title?: string;
  description?: string;
  starts_at?: string;
  duration_minutes?: number;
  type?: "Online" | "Venue";
  meeting_url?: string | null;
  venue_address?: string | null;
  max_attendees?: number | null;
  invite_emails?: string[];
}

export interface ProjectConsultationCancelPayload {
  reason: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    let msg = body.detail ?? "Request failed";
    if (Array.isArray(body.detail)) {
      msg = body.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function getPublicProjectConsultations(
  projectId: number
): Promise<PublicProjectConsultation[]> {
  const res = await fetch(`${API_BASE_URL}/api/public/projects/${projectId}/consultations`, {
    cache: "no-store",
  });
  return handleResponse<PublicProjectConsultation[]>(res);
}

export async function getProjectConsultations(
  projectId: number
): Promise<ProjectConsultation[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/consultations`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse<ProjectConsultation[]>(res);
}

export async function createProjectConsultation(
  projectId: number,
  payload: ProjectConsultationCreatePayload
): Promise<ProjectConsultation> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/consultations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectConsultation>(res);
}

export async function updateProjectConsultation(
  projectId: number,
  consultationId: number,
  payload: ProjectConsultationUpdatePayload
): Promise<ProjectConsultation> {
  const res = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/consultations/${consultationId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<ProjectConsultation>(res);
}

export async function cancelProjectConsultation(
  projectId: number,
  consultationId: number,
  reason: string
): Promise<ProjectConsultation> {
  const res = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/consultations/${consultationId}/cancel`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }
  );
  return handleResponse<ProjectConsultation>(res);
}
