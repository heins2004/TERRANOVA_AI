const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const complaintStatuses = ["Submitted", "UnderReview", "Resolved", "Dismissed"] as const;
export type ComplaintStatus = (typeof complaintStatuses)[number];

export type Complaint = {
  id: number;
  submitted_by: number;
  project_id: number | null;
  subject: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
};

export type ComplaintPayload = Pick<Complaint, "project_id" | "subject" | "description">;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.detail ?? "Unable to complete the complaint request.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export function getComplaints(filters: { project_id?: number } = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined) as [string, string][]);
  return request<Complaint[]>(`/api/complaints${query.size ? `?${query}` : ""}`);
}
export function createComplaint(payload: ComplaintPayload) { return request<Complaint>("/api/complaints", { method: "POST", body: JSON.stringify(payload) }); }
export function updateComplaintStatus(id: number, status: ComplaintStatus) { return request<Complaint>(`/api/complaints/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
