const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type PlanningDocument = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  project_id: number | null;
  original_filename: string;
  file_size_bytes: number;
  content_type: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
};

export type DocumentUploadPayload = {
  title: string;
  description: string;
  category: string;
  project_id: string;
  file: File;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Unable to complete the document request.");
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function getDocuments() { return request<PlanningDocument[]>("/api/documents"); }

export function uploadDocument(payload: DocumentUploadPayload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("category", payload.category);
  if (payload.project_id) formData.append("project_id", payload.project_id);
  formData.append("file", payload.file);
  return request<PlanningDocument>("/api/documents", { method: "POST", body: formData });
}

export function deleteDocument(id: number) { return request<void>(`/api/documents/${id}`, { method: "DELETE" }); }
export function getDocumentDownloadUrl(id: number) { return `${API_BASE_URL}/api/documents/${id}/download`; }
