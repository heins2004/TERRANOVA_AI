import { API_BASE_URL } from "@/lib/config";

export const consultationStatuses = ["Upcoming", "Ongoing", "Completed", "Cancelled"] as const;
export type ConsultationStatus = (typeof consultationStatuses)[number];

export type Consultation = {
  id: number; title: string; description: string; project_id: number | null; project_title: string | null;
  scheduled_at: string; location: string | null; status: ConsultationStatus; created_by: number; created_at: string;
};
export type ConsultationPayload = Pick<Consultation, "title" | "description" | "project_id" | "scheduled_at" | "location">;
export type ConsultationUpdatePayload = Partial<ConsultationPayload> & { status?: ConsultationStatus };
export type Feedback = { id: number; consultation_id: number; submitted_by: number; submitted_by_name: string | null; comment: string; created_at: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); const error = new Error(body.detail ?? "Unable to complete the consultation request.") as Error & { status?: number }; error.status = response.status; throw error; }
  return response.json() as Promise<T>;
}

export function getConsultations(filters: { project_id?: number } = {}) {
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
  return request<Consultation[]>(`/api/consultations${query.size ? `?${query}` : ""}`);
}
export function createConsultation(payload: ConsultationPayload) { return request<Consultation>("/api/consultations", { method: "POST", body: JSON.stringify(payload) }); }
export function updateConsultation(id: number, payload: ConsultationUpdatePayload) { return request<Consultation>(`/api/consultations/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export function getFeedback(consultationId: number) { return request<Feedback[]>(`/api/consultations/${consultationId}/feedback`); }
export function createFeedback(consultationId: number, comment: string) { return request<Feedback>(`/api/consultations/${consultationId}/feedback`, { method: "POST", body: JSON.stringify({ comment }) }); }
