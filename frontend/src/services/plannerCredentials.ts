import { API_BASE_URL } from "@/lib/config";

export type CredentialStatus = "Unsubmitted" | "Pending" | "Verified" | "Rejected";

export interface PlannerCredential {
  status: CredentialStatus;
  registration_number?: string | null;
  body_name?: string | null;
  document_original_name?: string | null;
  document_mime?: string | null;
  document_size?: number | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  is_backfilled?: boolean;
}

export interface AdminPlannerCredentialItem {
  user_id: number;
  full_name: string;
  email: string;
  registration_number?: string | null;
  body_name?: string | null;
  document_original_name?: string | null;
  document_size?: number | null;
  status: CredentialStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
}

export interface AdminPlannerCredentialsResponse {
  items: AdminPlannerCredentialItem[];
  total: number;
  limit: number;
  offset: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "Request failed.";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        errorDetail = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        errorDetail = data.detail[0].msg || JSON.stringify(data.detail[0]);
      }
    } catch {
      // Use status text if body cannot be parsed
      errorDetail = `Request failed with status ${res.status}`;
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export async function getPlannerCredentials(): Promise<PlannerCredential> {
  const res = await fetch(`${API_BASE_URL}/api/planner/credentials`, {
    credentials: "include",
  });
  return handleResponse<PlannerCredential>(res);
}

export async function submitPlannerCredentials(formData: FormData): Promise<PlannerCredential> {
  const res = await fetch(`${API_BASE_URL}/api/planner/credentials`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  return handleResponse<PlannerCredential>(res);
}

export function getPlannerDocumentUrl(): string {
  return `${API_BASE_URL}/api/planner/credentials/document`;
}

export async function getAdminPlannerCredentials(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminPlannerCredentialsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const res = await fetch(`${API_BASE_URL}/api/admin/planner-credentials?${query.toString()}`, {
    credentials: "include",
  });
  return handleResponse<AdminPlannerCredentialsResponse>(res);
}

export function getAdminDocumentUrl(userId: number): string {
  return `${API_BASE_URL}/api/admin/planner-credentials/${userId}/document`;
}

export async function verifyPlannerCredentials(userId: number): Promise<{ user_id: number; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/planner-credentials/${userId}/verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<{ user_id: number; status: string }>(res);
}

export async function rejectPlannerCredentials(
  userId: number,
  reason: string
): Promise<{ user_id: number; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/planner-credentials/${userId}/reject`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<{ user_id: number; status: string }>(res);
}
